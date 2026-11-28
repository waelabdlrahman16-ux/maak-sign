// Maak follow-up notifications. The phone asks for the public key, subscribes, and leaves a job:
// the date, a random case id and a short generic text (no names, no numbers, no bank details).
// A daily database job calls op "send"; the function sends what is due and forgets sent jobs after 7 days.
// The signing key pair is made here on first use and kept in the database (no person handles it).
// v3: only the Maak website may call (no Origin = refused, except the daily "send" job, which has its own secret);
//     new reminders are capped per caller and in total per Cairo day.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const ADD_PER_CALLER = 30;
const ADD_TOTAL = 1000;

const ALLOWED = ["https://maaksign.com", "https://www.maaksign.com", "https://waelabdlrahman16-ux.github.io", "http://localhost:8790"];
const cors = (o: string | null) => ({
  "Access-Control-Allow-Origin": o && ALLOWED.includes(o) ? o : ALLOWED[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info, x-maak-cron",
  "Vary": "Origin",
});
const json = (b: unknown, s: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function keys() {
  const { data } = await db.from("push_keys").select("public_key,private_key,cron_secret").eq("id", 1).maybeSingle();
  if (data) return data;
  const k = webpush.generateVAPIDKeys();
  await db.from("push_keys").insert({ id: 1, public_key: k.publicKey, private_key: k.privateKey });
  const { data: d2 } = await db.from("push_keys").select("public_key,private_key,cron_secret").eq("id", 1).single();
  return d2!;
}
// Daily limits. The caller's address is hashed with a server secret; the raw address is never stored.
async function underLimit(req: Request, bucket: string, perCaller: number, total: number): Promise<boolean> {
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-24) + "|" + ip));
  const who = btoa(String.fromCharCode(...new Uint8Array(d))).replace(/[^A-Za-z0-9]/g, "").slice(0, 22);
  const hit = async (key: string, limit: number) => {
    const { data, error } = await db.rpc("rate_hit", { p_key: key, p_limit: limit });
    return !error && data === true;
  };
  return (await hit(bucket + ":" + who, perCaller)) && (await hit(bucket + ":all", total));
}
const cairoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
const okEndpoint = (u: string) => {
  try { const x = new URL(u); return x.protocol === "https:" && /(^|\.)(googleapis\.com|mozilla\.com|mozaws\.net|push\.apple\.com|notify\.windows\.com|windows\.com)$/.test(x.hostname); } catch { return false; }
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const h = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return json({ error: "method" }, 405, h);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "json" }, 400, h); }

  if (b?.op === "send") {
    const k = await keys();
    if (req.headers.get("x-maak-cron") !== k.cron_secret) return json({ error: "auth" }, 403, h);
    const today = cairoToday();
    const { data: jobs } = await db.from("push_jobs").select("*").is("sent_at", null).lte("due_date", today).limit(500);
    let sent = 0, gone = 0, failed = 0;
    for (const j of jobs || []) {
      try {
        const d = webpush.generateRequestDetails({ endpoint: j.endpoint, keys: { p256dh: j.p256dh, auth: j.auth } },
          JSON.stringify({ title: "معاك", body: j.body, url: "https://maaksign.com/agent/?case=" + j.case_ref }),
          { TTL: 86400, urgency: "normal", vapidDetails: { subject: "mailto:waelabdlrahman16@gmail.com", publicKey: k.public_key, privateKey: k.private_key } });
        const r = await fetch(d.endpoint, { method: "POST", headers: d.headers as Record<string, string>, body: d.body as unknown as BodyInit });
        if (r.status === 404 || r.status === 410) { await db.from("push_jobs").delete().eq("id", j.id); gone++; continue; }
        if (r.ok) { await db.from("push_jobs").update({ sent_at: new Date().toISOString() }).eq("id", j.id); sent++; } else failed++;
      } catch { failed++; }
    }
    await db.from("push_jobs").delete().lt("sent_at", new Date(Date.now() - 7 * 864e5).toISOString());
    return json({ today, due: (jobs || []).length, sent, gone, failed }, 200, h);
  }

  if (!origin || !ALLOWED.includes(origin)) return json({ error: "origin" }, 403, h);
  if (b?.op === "key") return json({ key: (await keys()).public_key }, 200, h);
  if (b?.op === "add") {
    const s = b.sub || {}, endpoint = String(s.endpoint || ""), p256dh = String(s.keys?.p256dh || ""), auth = String(s.keys?.auth || "");
    const due = String(b.date || ""), caseRef = String(b.case || ""), body = String(b.text || "").slice(0, 120);
    if (!okEndpoint(endpoint) || !/^[A-Za-z0-9_-]{80,100}$/.test(p256dh) || !/^[A-Za-z0-9_-]{16,24}$/.test(auth)) return json({ error: "sub" }, 400, h);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due < cairoToday()) return json({ error: "date" }, 400, h);
    if (!/^[a-z0-9]{8,24}$/.test(caseRef) || !body || /\d{5,}/.test(body)) return json({ error: "case" }, 400, h);
    if (!(await underLimit(req, "push_add", ADD_PER_CALLER, ADD_TOTAL))) return json({ error: "limit" }, 429, h);
    await db.from("push_jobs").delete().eq("endpoint", endpoint).eq("case_ref", caseRef);
    const { error } = await db.from("push_jobs").insert({ endpoint, p256dh, auth, due_date: due, case_ref: caseRef, body });
    if (error) return json({ error: "store" }, 500, h);
    return json({ ok: true, date: due }, 200, h);
  }
  if (b?.op === "cancel") {
    await db.from("push_jobs").delete().eq("endpoint", String(b.endpoint || "")).eq("case_ref", String(b.case || ""));
    return json({ ok: true }, 200, h);
  }
  return json({ error: "op" }, 400, h);
});
