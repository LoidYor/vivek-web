import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_BYTES = 50 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 900;
const DOWNLOAD_URL_TTL_SECONDS = 300;

const CATEGORY_BUCKET_ENV: Record<string, string> = {
  notes: "R2_BUCKET_NOTES",
  pyq: "R2_BUCKET_PYQ",
  assignment: "R2_BUCKET_ASSIGNMENT",
};

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);

const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const r2 = new AwsClient({
  accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID") ?? "",
  secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "",
  service: "s3",
  region: "auto",
});

class ClientError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bucketFor(category: string): string {
  const envName = CATEGORY_BUCKET_ENV[category];
  const bucket = envName ? Deno.env.get(envName) : undefined;
  if (!bucket) throw new ClientError("Storage is not configured for this category.", 500);
  return bucket;
}

function objectUrl(bucket: string, key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${Deno.env.get("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${bucket}/${encodedKey}`;
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+/, "").slice(0, 120) || "file";
}

function parseMaterialInput(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : NaN;

  if (!title || title.length > 200) throw new ClientError("Title is required (max 200 characters).", 400);
  if (!subject || subject.length > 100) throw new ClientError("Subject is required (max 100 characters).", 400);
  if (!(category in CATEGORY_BUCKET_ENV)) throw new ClientError("Choose a valid category.", 400);
  if (!fileName) throw new ClientError("File name is required.", 400);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ClientError("Only PDF, Word, PowerPoint, PNG, and JPEG files are allowed.", 400);
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    throw new ClientError("File must be between 1 byte and 50 MB.", 400);
  }

  return { title, subject, category, fileName, mimeType, sizeBytes };
}

async function requireAdmin(req: Request): Promise<void> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (token) {
    const { data, error } = await adminClient.auth.getUser(token);
    if (!error && data.user) {
      const { data: admin, error: adminError } = await adminClient
        .from("admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (adminError) throw adminError;
      if (admin) return;
    }
  }
  throw new ClientError("You do not have permission to do that.", 403);
}

async function isAdmin(req: Request): Promise<boolean> {
  try {
    await requireAdmin(req);
    return true;
  } catch {
    return false;
  }
}

async function createUpload(body: Record<string, unknown>) {
  const input = parseMaterialInput(body);
  const bucket = bucketFor(input.category);
  const objectKey = `${input.category}/${crypto.randomUUID()}/${safeFileName(input.fileName)}`;

  const url = new URL(objectUrl(bucket, objectKey));
  url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_SECONDS));
  const signed = await r2.sign(url, { method: "PUT", aws: { signQuery: true } });

  return { uploadUrl: signed.url, objectKey };
}

async function registerMaterial(body: Record<string, unknown>) {
  const input = parseMaterialInput(body);
  const objectKey = typeof body.objectKey === "string" ? body.objectKey : "";
  const keyPattern = new RegExp(`^${input.category}/[0-9a-f-]{36}/[A-Za-z0-9._-]+$`);
  if (!keyPattern.test(objectKey)) throw new ClientError("Upload reference is invalid.", 400);

  const bucket = bucketFor(input.category);
  const head = await r2.fetch(objectUrl(bucket, objectKey), { method: "HEAD" });
  if (!head.ok || head.headers.get("content-length") !== String(input.sizeBytes)) {
    throw new ClientError("The file was not uploaded. Please try again.", 400);
  }

  const { data, error } = await adminClient
    .from("materials")
    .insert({
      title: input.title,
      subject: input.subject,
      category: input.category,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      bucket,
      object_key: objectKey,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { id: data.id };
}

async function deleteMaterial(body: Record<string, unknown>) {
  const id = typeof body.id === "string" ? body.id : "";
  const { data: material, error } = await adminClient
    .from("materials")
    .select("id, bucket, object_key")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!material) throw new ClientError("That material no longer exists.", 404);

  const removed = await r2.fetch(objectUrl(material.bucket, material.object_key), { method: "DELETE" });
  if (!removed.ok) throw new Error(`R2 delete failed with status ${removed.status}`);

  const { error: deleteError } = await adminClient.from("materials").delete().eq("id", id);
  if (deleteError) throw deleteError;

  return { ok: true };
}

async function downloadLink(body: Record<string, unknown>) {
  const id = typeof body.id === "string" ? body.id : "";
  const { data: material, error } = await adminClient
    .from("materials")
    .select("bucket, object_key, file_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!material) throw new ClientError("That material no longer exists.", 404);

  const url = new URL(objectUrl(material.bucket, material.object_key));
  url.searchParams.set("X-Amz-Expires", String(DOWNLOAD_URL_TTL_SECONDS));
  url.searchParams.set(
    "response-content-disposition",
    `attachment; filename="${safeFileName(material.file_name)}"`,
  );
  const signed = await r2.sign(url, { method: "GET", aws: { signQuery: true } });

  return { url: signed.url };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    switch (body.action) {
      case "status":
        return json({ isAdmin: await isAdmin(req) });
      case "download":
        return json(await downloadLink(body));
      case "createUpload":
        await requireAdmin(req);
        return json(await createUpload(body));
      case "register":
        await requireAdmin(req);
        return json(await registerMaterial(body));
      case "delete":
        await requireAdmin(req);
        return json(await deleteMaterial(body));
      default:
        return json({ error: "Unknown request." }, 400);
    }
  } catch (err) {
    if (err instanceof ClientError) return json({ error: err.message }, err.status);
    console.error("materials function failed", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
