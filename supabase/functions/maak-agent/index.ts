// Maak Sign agent brain. Turns recognised signs into a natural Egyptian Arabic request,
// matches a teller's free-typed reply to a known phrase by meaning, and simplifies any other
// reply into a short sentence plus the known signs that carry its meaning.
// Only text reaches this function; video never leaves the customer's phone.
// The Anthropic key lives in the ANTHROPIC_API_KEY secret. Without it the function
// answers {fallback:true} and the app keeps using its built-in rules.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED = ["https://waelabdlrahman16-ux.github.io", "http://localhost:8790"];
const MODEL = "claude-haiku-5-5";

const PROMPTS: Record<string, string> = {
  compose:
    "You are Maak, an assistant for a deaf Egyptian customer at a bank counter. The input lists the signs the customer made, in order, as Arabic words, plus the visit goal and amount if known. Write ONE short, polite sentence in Egyptian Arabic (at most 15 words), in the first person as the customer speaking, that the customer most likely means, for the bank teller to read. The signs come first: use the goal and amount only when the signs are about money, the card, the account or the visit goal. A greeting, thanks, apology, \"how are you\", \"where\" question or request for help stays exactly that, with no goal or amount added. Never invent numbers, names or requests. Give the sentence in text.",
  match:
    "A bank teller typed a reply for a deaf customer. Pick the phrase from the numbered list that has the same meaning, so it can be shown as a sign-language video. If no phrase means the same thing, answer -1. Give the number in index.",
  simplify:
    "A bank teller typed a reply for a deaf Egyptian customer who may not read well. Rewrite it as very short, simple Egyptian Arabic (one or two short sentences, at most 14 words) with the same meaning. Keep every fact the customer needs: what will happen, what they must do, when, and any number, time or amount. Drop only politeness and filler. Then pick up to 5 signs from the vocabulary list, in order, that together carry that meaning. The vocabulary is given as \"key: Arabic word\"; put only the keys (the part before the colon, in Latin letters) in words. Never add meaning that is not in the reply. Give the sentence in text and the keys in words.",
};

function cors(origin: string | null) {
  const o = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, h: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
}

function validate(task: string, p: any): string | null {
  if (task === "compose") {
    if (!Array.isArray(p?.signs) || p.signs.length < 1 || p.signs.length > 12) return "signs";
    if (!p.signs.every((s: unknown) => typeof s === "string" && s.length <= 30)) return "signs";
    if (p.goal != null && (typeof p.goal !== "string" || p.goal.length > 80)) return "goal";
    if (p.amount != null && (typeof p.amount !== "string" || p.amount.length > 30)) return "amount";
    return null;
  }
  if (task === "match") {
    if (typeof p?.text !== "string" || p.text.length < 1 || p.text.length > 300) return "text";
    if (!Array.isArray(p?.phrases) || p.phrases.length < 1 || p.phrases.length > 60) return "phrases";
    if (!p.phrases.every((s: unknown) => typeof s === "string" && s.length <= 120)) return "phrases";
    return null;
  }
  if (task === "simplify") {
    if (typeof p?.text !== "string" || p.text.length < 1 || p.text.length > 300) return "text";
    if (!Array.isArray(p?.vocab) || p.vocab.length < 1 || p.vocab.length > 80) return "vocab";
    if (!p.vocab.every((v: any) => v && typeof v.k === "string" && v.k.length <= 30 && typeof v.ar === "string" && v.ar.length <= 40)) return "vocab";
    return null;
  }
  return "task";
}

// Pull the first balanced JSON object out of the model's text (tolerates code fences or extra prose).
function firstObject(text: string): any | null {
  const s = text.replace(/```(?:json)?/gi, "");
  for (let i = s.indexOf("{"); i !== -1; i = s.indexOf("{", i + 1)) {
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === "\"") inStr = false; continue; }
      if (c === "\"") inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) { try { return JSON.parse(s.slice(i, j + 1)); } catch { break; } }
    }
  }
  return null;
}

const SCHEMAS: Record<string, any> = {
  compose: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  match: { type: "object", properties: { index: { type: "integer" } }, required: ["index"] },
  simplify: {
    type: "object",
    properties: { text: { type: "string" }, words: { type: "array", items: { type: "string" }, maxItems: 5 } },
    required: ["text", "words"],
  },
};

// Forced tool call: the model can only answer with the fields in SCHEMAS[task].
async function ask(key: string, task: string, input: unknown, signal: AbortSignal) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: PROMPTS[task],
      tools: [{ name: "answer", description: "Return the answer.", input_schema: SCHEMAS[task] }],
      tool_choice: { type: "tool", name: "answer" },
      messages: [{ role: "user", content: JSON.stringify(input) }],
    }),
  });
  if (!r.ok) return { status: r.status, out: null, stop: "" };
  const data = await r.json();
  const blocks: any[] = data?.content || [];
  const tool = blocks.find((c) => c?.type === "tool_use" && c?.input && typeof c.input === "object");
  const out = tool ? tool.input : firstObject(blocks.map((c) => c?.type === "text" ? c.text || "" : "").join(""));
  return { status: 200, out, stop: String(data?.stop_reason || "") };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return json({ error: "method" }, 405, h);
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED.includes(origin)) return json({ error: "origin" }, 403, h);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "json" }, 400, h); }
  const task = String(body?.task || "");
  const bad = validate(task, body?.payload);
  if (bad) return json({ error: "invalid " + bad }, 400, h);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ fallback: true, reason: "no_key" }, 200, h);

  const p = body.payload;
  const input = task === "match"
    ? { text: p.text, phrases: p.phrases.map((t: string, i: number) => `${i}: ${t}`) }
    : task === "simplify"
    ? { reply: p.text, vocabulary: p.vocab.map((v: any) => `${v.k}: ${v.ar}`) }
    : { signs: p.signs, goal: p.goal ?? null, amount: p.amount ?? null };

  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 9000);
    let res = await ask(key, task, input, ctl.signal);
    if (res.status === 200 && !res.out) res = await ask(key, task, input, ctl.signal); // one retry on unparsable output
    clearTimeout(timer);
    if (res.status !== 200) return json({ fallback: true, reason: "upstream_" + res.status }, 200, h);
    const out = res.out;
    if (!out) return json({ fallback: true, reason: "parse", stop: res.stop }, 200, h);
    if (task === "compose") {
      if (typeof out.text !== "string" || !out.text.trim() || out.text.length > 160) return json({ fallback: true, reason: "shape" }, 200, h);
      return json({ text: out.text.trim() }, 200, h);
    }
    if (task === "simplify") {
      const byKey = new Map(p.vocab.map((v: any) => [v.k, v.k]));
      const byAr = new Map(p.vocab.map((v: any) => [v.ar, v.k]));
      const t = typeof out.text === "string" ? out.text.trim() : "";
      const words = Array.isArray(out.words)
        ? [...new Set(out.words.map((w: unknown) => typeof w === "string" ? (byKey.get(w.trim()) ?? byAr.get(w.trim())) : undefined).filter(Boolean))].slice(0, 5)
        : [];
      if (!t || t.length > 120) return json({ fallback: true, reason: "shape" }, 200, h);
      return json({ text: t, words }, 200, h);
    }
    const i = Number(out.index);
    if (!Number.isInteger(i) || i < -1 || i >= p.phrases.length) return json({ fallback: true, reason: "shape" }, 200, h);
    return json({ index: i }, 200, h);
  } catch (_e) {
    return json({ fallback: true, reason: "error" }, 200, h);
  }
});
