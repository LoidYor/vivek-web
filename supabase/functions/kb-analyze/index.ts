// KnowledgeBridge AI analyzer — proxies the AI provider so the API key
// never reaches the browser. CORS headers are mandatory on every response.
import { corsHeaders } from '../shared/cors.ts';

const GEMINI_MODEL = 'gemini-2.0-flash';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? null;
    const body = await req.json().catch(() => ({}));

    if (body?.probe) {
      return new Response(
        JSON.stringify({ aiConfigured: Boolean(apiKey), model: apiKey ? GEMINI_MODEL : null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI provider not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
      },
    );
    if (!aiRes.ok) {
      return new Response(
        JSON.stringify({ error: `AI provider error (${aiRes.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const aiJson = await aiRes.json();
    const text: string = aiJson?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    return new Response(
      JSON.stringify({ text, model: GEMINI_MODEL }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
