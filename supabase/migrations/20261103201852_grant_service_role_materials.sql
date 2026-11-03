/*
# Grant server role access to materials and admins

1. Modified Tables
- `materials` and `admins`: grants added for the service role so the server function can read, insert, and delete rows.

2. Security
- Clients still have no write access. Only the server function (which verifies admin status first) uses these privileges.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON materials TO service_role;
GRANT SELECT ON admins TO service_role;
