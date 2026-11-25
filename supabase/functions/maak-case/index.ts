// Maak case copy. The phone encrypts the customer's open cases with a key made from a code only
// the customer holds (AES-GCM, PBKDF2). This function only stores and returns the locked bytes:
// it never sees the code, the key or anything readable. Copies older than 180 days are deleted.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ALLOWED = ["https://maaksign.com", "https://www.maaksign.com", "https://waelabdlrahman16-ux.github.io", "http://localhost:8790"];
const cors = (o: string | null) => ({
  "Access-Control-Allow-Origin": o && ALLOWED.includes(o) ? o : ALLOWED[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Vary": "Origin",
});
const json = (b: unknown, s: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const h = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return json({ error: "method" }, 405, h);
  if (origin && !ALLOWED.includes(origin)) return json({ error: "origin" }, 403, h);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "json" }, 400, h); }
  const id = String(b?.id || "");
  if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: "id" }, 400, h);
  if (b.op === "put") {
    const iv = String(b.iv || ""), data = String(b.data || "");
    if (!/^[A-Za-z0-9_-]{16}$/.test(iv) || !/^[A-Za-z0-9_-]{20,300000}$/.test(data)) return json({ error: "data" }, 400, h);
    const { error } = await db.from("case_backups").upsert({ id, iv, data, updated_at: new Date().toISOString() });
    if (error) return json({ error: "store" }, 500, h);
    await db.from("case_backups").delete().lt("updated_at", new Date(Date.now() - 180 * 864e5).toISOString());
    return json({ ok: true }, 200, h);
  }
  if (b.op === "get") {
    const { data, error } = await db.from("case_backups").select("iv,data,updated_at").eq("id", id).maybeSingle();
    if (error) return json({ error: "store" }, 500, h);
    if (!data) return json({ found: false }, 200, h);
    return json({ found: true, ...data }, 200, h);
  }
  if (b.op === "del") {
    await db.from("case_backups").delete().eq("id", id);
    return json({ ok: true }, 200, h);
  }
  return json({ error: "op" }, 400, h);
});
