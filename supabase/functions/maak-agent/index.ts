// Maak Sign agent brain.
// Translator tasks (v7): compose, match, simplify.
// Agent tasks (v10: counter loop also returns picture cards for the staff reply; v9: plan prefers official facts and names an official from-home option): plan a visit, run the counter loop (next), read a paper (read), and summarise (summary).
// v21: English mode — payload.lang "en" makes every customer/staff text English (demo and judges).
// v20: compose may not add requests the signs do not contain (prompt + server guard).
// v19: letter — the paper the customer hands to the staff (request or police statement).
// Only text and, for "read", one photo reach this function; the photo is used once and never stored.
// Video never leaves the customer's phone. The Anthropic key lives in the ANTHROPIC_API_KEY secret;
// without it the function answers {fallback:true} and the app keeps using its built-in rules.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ICONS, KNOWLEDGE } from "./knowledge.ts";

const ALLOWED = ["https://maaksign.com", "https://www.maaksign.com", "https://waelabdlrahman16-ux.github.io", "http://localhost:8790"];
const FAST = "claude-haiku-5-5";
const SMART = "claude-sonnet-5-5";
const AGENT_TASKS = ["plan", "next", "read", "summary", "letter"];
// plan and read use the smart model; the counter loop (next) and summary use the fast one so each turn is quick.
const SMART_TASKS = ["plan", "read"];
// compose guard: signs that are only identity/greeting words are shown exactly as signed
const COMPOSE_PLAIN = ["أنا", "أصم", "أهلاً", "أهلا", "شكراً", "شكرا", "آسف", "تمام", "أيوه", "لأ"];

const STYLE =
  "Write for a deaf Egyptian adult who may read little and is in a hurry: Egyptian Arabic, very short, everyday words, no formal Arabic, numbers as digits. " +
  "Honesty rules: state a fee, document, date, time or number ONLY if it appears in the KNOWLEDGE facts or in what the staff said. " +
  "A fact marked level \"news\" is not confirmed: present it as usual practice and turn it into a question for the staff to confirm. " +
  "Anything you do not know becomes a question for the staff, never a guess. Never give medical, legal or financial advice. " +
  "Sign keys: pick only keys from the vocabulary list (the part before the colon). Icons: pick only from the icon list.";

const PROMPTS: Record<string, string> = {
  compose:
    "You are Maak, an assistant for a deaf Egyptian customer at a bank counter. The input lists the signs the customer made, in order, as Arabic words, plus the visit goal and amount if known. Write ONE short, polite sentence in Egyptian Arabic (at most 15 words), in the first person as the customer speaking, that the customer most likely means, for the bank teller to read. The signs come first: use the goal and amount only when the signs are about money, the card, the account or the visit goal. A greeting, thanks, apology, \"how are you\", \"where\" question or request for help stays exactly that, with no goal or amount added. The sentence may only express what the signs say: never add a request, question, reason or politeness clause the signs do not contain (e.g. أنا + أصم → \"أنا أصم.\", not a request to write). Never invent numbers, names or requests. Give the sentence in text.",
  match:
    "A bank teller typed a reply for a deaf customer. Pick the phrase from the numbered list that has the same meaning, so it can be shown as a sign-language video. If no phrase means the same thing, answer -1. Give the number in index.",
  simplify:
    "A bank teller typed a reply for a deaf Egyptian customer who may not read well. Rewrite it as very short, simple Egyptian Arabic (one or two short sentences, at most 14 words) with the same meaning. Keep every fact the customer needs: what will happen, what they must do, when, and any number, time or amount. Drop only politeness and filler. Then pick up to 5 signs from the vocabulary list, in order, that together carry that meaning. The vocabulary is given as \"key: Arabic word\"; put only the keys (the part before the colon, in Latin letters) in words. Never add meaning that is not in the reply. Give the sentence in text and the keys in words.",
  plan:
    "You are Maak, an agent that helps a deaf Egyptian person get a task done at a service counter (bank, civil registry, social unit, hospital). Given the goal and the place, plan the visit: 2 to 5 short steps in order (each at most 6 words), and for each step the exact polite question Maak will show the staff on the customer's behalf (at most 18 words, Egyptian Arabic, addressed to the staff), or an empty string if no question is needed. List what to bring (each at most 5 words), and the fee: if a KNOWLEDGE fact gives the fee for this goal, put it (e.g. \"100 جنيه\") with that fact id, else empty text. In words, pick the sign keys that carry the goal (e.g. card, lost, new). For every step, item and the fee, set from to the id of the KNOWLEDGE fact it comes from (e.g. \"f1\"), or an empty string if it comes from no fact. Items with no fact are fine but must not contain numbers. If a step can only be done by phone and the customer is deaf, say Maak will ask the staff to do it. Prefer official facts over news facts. If an official fact offers a way to do the goal from home or online without the counter, the warning must say so (e.g. «ممكن تطلبها من البيت على موقع مصر الرقمية»). Otherwise add one warning only if it really matters (at most 12 words), else empty. " + STYLE,
  next:
    "You are Maak, running a visit at a service counter for a deaf Egyptian customer. You get the goal, the planned steps with their status, and the conversation so far (staff = what the staff said or typed, customer = what the customer signed or tapped, maak = what Maak already asked). Decide: for EVERY planned step, its state in progress: \"done\" only if the staff did it now or said it is done, or (for a step that is asking something) the staff answered it; \"customer_todo\" if the staff says the customer still has to do it (file, bring, pay, come back); \"open\" otherwise; any new concrete facts the staff stated (fee, date, time, number, place, document) copied exactly; the single most useful next question Maak should show the staff (at most 20 words, polite Egyptian Arabic to the staff; empty if nothing is missing or the staff just needs to act); what to tell the customer now (at most 14 words, very simple); up to 3 one-tap replies the customer may want (each at most 4 words, first person); up to 3 picture cards that show what the staff said without reading (cards): one card per idea, in the order the staff said them; each card has an icon (badge = bring national ID, credit_card = bank card, payments = pay money, event = a day or date, schedule = a time, storefront = go to a window or counter, hourglass_top = wait, description = a paper or form, edit_document = sign or fill a paper, photo_camera = photo, check_circle = done or approved, cancel = refused or not possible, location_on = another place), a text of at most 3 very simple Egyptian words (for example «هات البطاقة», «تعالى بكرة», «شباك ٣»; any number must be one the staff said), and word = the one vocabulary sign key that best shows the card, or empty; and finished=true only when every step is done or the staff said there is nothing more. Never ask about anything the staff already answered in the conversation, and never repeat a question Maak already asked unless the staff did not answer it; ask only about what is still unknown and matters for the goal. " + STYLE,
  read:
    "You are Maak. A deaf Egyptian person photographed a paper or a phone screen at a service counter. Say what it is (kind), a short title (at most 8 words), up to 5 key facts copied EXACTLY as printed (amounts, dates, reference numbers, names of places or documents) with a short label each, and the one next step the person should take (at most 14 words). If the photo is blurry, cut off or unreadable, set unclear=true and say so in next instead of guessing. Do not read out or repeat full card numbers, national ID numbers or account numbers: show only the last 4 digits. " + STYLE,
  letter:
    "You are Maak. Write the short paper a deaf Egyptian customer will hand to the staff, in the customer's own voice (first person). If paper_wanted is given, use that kind; otherwise pick \"police_statement\" only when the goal is reporting a lost or stolen national ID or document to the police, else \"request\". A police_statement is addressed to the police station (\"السيد مأمور قسم الشرطة\") and states what was lost, roughly when and where only if the customer or staff said so, and asks for a police report (محضر فقد) to be written. to = who it is addressed to (e.g. \"السيد مدير فرع بنك مصر\", \"السيد رئيس الوحدة الاجتماعية\", \"السيد مأمور القسم\"), at most 8 words. subject = at most 8 words. lines = 3 to 6 short sentences in clear, polite, simple Modern Standard Arabic that any clerk understands: first say the customer is deaf and communicates in Egyptian Sign Language and asks for written replies; then state exactly what happened and what they request, using only the goal, the conversation and the facts. Never invent dates, amounts, names, numbers, places or events; never write a card, account or national ID number (the customer fills those by hand). Never say that anything was paid, done, received or stopped unless the staff said exactly that; a fee the staff mentioned is only a fee to pay. Do not promise anything on behalf of the staff. Numbers as digits. A fact marked level \"news\" is not confirmed: do not state it as a rule.",
  summary:
    "You are Maak. Summarise a finished visit for a deaf Egyptian customer: a title (at most 5 words), up to 5 lines (each at most 8 words) covering what was done, the fee paid, and what happens next, using only what the staff said and the facts collected during the visit; never claim something was paid or done unless the staff said so. If the staff gave a pickup or follow-up date, set remind.date as YYYY-MM-DD (today's date is given; resolve phrases like \"after 3 days\") and remind.text (at most 8 words); otherwise leave remind.date empty. " + STYLE,
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

const str = (v: unknown, max: number, min = 0) => typeof v === "string" && v.length >= min && v.length <= max;
const vocabOk = (v: unknown) =>
  v == null || (Array.isArray(v) && v.length <= 80 && v.every((x: any) => x && str(x.k, 30) && str(x.ar, 40)));
const stepsOk = (v: unknown) =>
  Array.isArray(v) && v.length >= 1 && v.length <= 8 &&
  v.every((s: any) => s && str(s.id, 10, 1) && str(s.text, 80, 1) && ["open", "done"].includes(s.status));
const turnsOk = (v: unknown) =>
  Array.isArray(v) && v.length <= 30 &&
  v.every((t: any) => t && ["staff", "customer", "maak"].includes(t.who) && str(t.text, 300, 1));
const factsOk = (v: unknown) =>
  v == null || (Array.isArray(v) && v.length <= 12 && v.every((f: any) => f && str(f.label, 40) && str(f.value, 80)));

function validate(task: string, p: any): string | null {
  if (task === "compose") {
    if (!Array.isArray(p?.signs) || p.signs.length < 1 || p.signs.length > 12) return "signs";
    if (!p.signs.every((s: unknown) => typeof s === "string" && s.length <= 30)) return "signs";
    if (p.goal != null && (typeof p.goal !== "string" || p.goal.length > 80)) return "goal";
    if (p.amount != null && (typeof p.amount !== "string" || p.amount.length > 30)) return "amount";
    return null;
  }
  if (task === "match") {
    if (!str(p?.text, 300, 1)) return "text";
    if (!Array.isArray(p?.phrases) || p.phrases.length < 1 || p.phrases.length > 60) return "phrases";
    if (!p.phrases.every((s: unknown) => typeof s === "string" && s.length <= 120)) return "phrases";
    return null;
  }
  if (task === "simplify") {
    if (!str(p?.text, 300, 1)) return "text";
    if (!Array.isArray(p?.vocab) || p.vocab.length < 1 || !vocabOk(p.vocab)) return "vocab";
    return null;
  }
  if (!AGENT_TASKS.includes(task)) return "task";
  if (task === "read" ? !(p?.goal == null || str(p.goal, 120)) : !str(p?.goal, 120, 1)) return "goal";
  if (p?.place != null && !(str(p.place, 40) && p.place in KNOWLEDGE)) return "place";
  if (!vocabOk(p?.vocab)) return "vocab";
  if (task === "next" || task === "summary") {
    if (!stepsOk(p?.steps)) return "steps";
    if (!turnsOk(p?.turns)) return "turns";
    if (!factsOk(p?.facts)) return "facts";
  }
  if (task === "summary" && !/^\d{4}-\d{2}-\d{2}$/.test(String(p?.today || ""))) return "today";
  if (task === "letter") {
    if (p?.want != null && !["request", "police_statement"].includes(p.want)) return "want";
    if (p?.steps != null && !stepsOk(p.steps)) return "steps";
    if (!(p?.turns == null || (Array.isArray(p.turns) && p.turns.length === 0) || turnsOk(p.turns))) return "turns";
    if (!factsOk(p?.facts)) return "facts";
  }
  if (task === "read") {
    if (!["image/jpeg", "image/png", "image/webp"].includes(p?.media_type)) return "media_type";
    if (typeof p?.image !== "string" || p.image.length < 100 || p.image.length > 3_000_000) return "image";
    if (!/^[A-Za-z0-9+/=]+$/.test(p.image.slice(0, 200))) return "image";
  }
  return null;
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

const icon = { type: "string", enum: ICONS };
const keys = { type: "array", items: { type: "string" }, maxItems: 5 };
const factItem = { type: "object", properties: { icon, label: { type: "string" }, value: { type: "string" } }, required: ["icon", "label", "value"] };

const SCHEMAS: Record<string, any> = {
  compose: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  match: { type: "object", properties: { index: { type: "integer" } }, required: ["index"] },
  simplify: {
    type: "object",
    properties: { text: { type: "string" }, words: keys },
    required: ["text", "words"],
  },
  plan: {
    type: "object",
    properties: {
      title: { type: "string" },
      steps: {
        type: "array", minItems: 2, maxItems: 5,
        items: { type: "object", properties: { text: { type: "string" }, icon, ask: { type: "string" }, from: { type: "string" } }, required: ["text", "icon", "ask", "from"] },
      },
      bring: {
        type: "array", maxItems: 5,
        items: { type: "object", properties: { text: { type: "string" }, icon, from: { type: "string" } }, required: ["text", "icon", "from"] },
      },
      fee: { type: "object", properties: { text: { type: "string" }, from: { type: "string" } }, required: ["text", "from"] },
      warn: { type: "string" },
      words: keys,
    },
    required: ["title", "steps", "bring", "fee", "warn", "words"],
  },
  next: {
    type: "object",
    properties: {
      progress: {
        type: "array",
        items: { type: "object", properties: { id: { type: "string" }, state: { type: "string", enum: ["done", "customer_todo", "open"] } }, required: ["id", "state"] },
      },
      facts: { type: "array", maxItems: 4, items: factItem },
      ask_staff: { type: "string" },
      tell_customer: { type: "string" },
      words: keys,
      replies: { type: "array", items: { type: "string" }, maxItems: 3 },
      cards: { type: "array", maxItems: 3, items: { type: "object", properties: { icon, text: { type: "string" }, word: { type: "string" } }, required: ["icon", "text", "word"] } },
      finished: { type: "boolean" },
    },
    required: ["progress", "facts", "ask_staff", "tell_customer", "words", "replies", "cards", "finished"],
  },
  read: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["receipt", "form", "letter", "prescription", "bill", "card", "screen", "other"] },
      title: { type: "string" },
      facts: { type: "array", maxItems: 5, items: factItem },
      next: { type: "string" },
      words: keys,
      unclear: { type: "boolean" },
    },
    required: ["kind", "title", "facts", "next", "words", "unclear"],
  },
  letter: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["request", "police_statement"] },
      to: { type: "string" },
      subject: { type: "string" },
      lines: { type: "array", minItems: 2, maxItems: 6, items: { type: "string" } },
    },
    required: ["kind", "to", "subject", "lines"],
  },
  summary: {
    type: "object",
    properties: {
      title: { type: "string" },
      lines: { type: "array", maxItems: 5, items: { type: "object", properties: { icon, text: { type: "string" } }, required: ["icon", "text"] } },
      remind: { type: "object", properties: { date: { type: "string" }, text: { type: "string" } }, required: ["date", "text"] },
      words: keys,
    },
    required: ["title", "lines", "remind", "words"],
  },
};

// Forced tool call: the model can only answer with the fields in SCHEMAS[task].
async function ask(key: string, task: string, content: unknown, signal: AbortSignal, strict = false, en = false) {
  // strict = the fast model with a forced tool call (always returns the full schema); used as the
  // agent tasks' backup when the smart model's answer comes back incomplete.
  const agent = SMART_TASKS.includes(task) && !strict;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: agent ? SMART : FAST,
      max_tokens: AGENT_TASKS.includes(task) ? 1200 : 400,
      // The agent model does not accept a forced tool choice, so it is told to call the tool and
      // a plain-JSON reply is still parsed by firstObject.
      system: PROMPTS[task] + (AGENT_TASKS.includes(task) ? " Always reply only by calling the answer tool, once, filling every field." : "") + (en ? " LANGUAGE OVERRIDE: the app is in English mode. Every text a person will read must be in short, plain English, never Arabic: sentences, the plan title, steps, questions to the staff, what to bring, the fee text (e.g. \"100 EGP\"), picture cards (at most 3 English words, e.g. \"Bring your ID\", \"Come tomorrow\", \"Window 3\"), replies, facts, letters and summaries. Keep every fact id (from) and every number exactly as the rules say. Sign keys stay as given." : ""),
      tools: [{ name: "answer", description: "Return the answer.", input_schema: SCHEMAS[task] }],
      tool_choice: agent ? { type: "auto" } : { type: "tool", name: "answer" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!r.ok) {
    let msg = "";
    try { msg = String((await r.json())?.error?.message || "").slice(0, 200); } catch { /* no body */ }
    return { status: r.status, out: null, stop: msg };
  }
  const data = await r.json();
  const blocks: any[] = data?.content || [];
  const tool = blocks.find((c) => c?.type === "tool_use" && c?.input && typeof c.input === "object");
  const out = tool ? tool.input : firstObject(blocks.map((c) => c?.type === "text" ? c.text || "" : "").join(""));
  return { status: 200, out, stop: String(data?.stop_reason || "") };
}

// ---------- honesty guard: every number the agent states must exist in its evidence ----------
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const latin = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
const numbers = (s: string) => (latin(s).match(/\d+/g) || []).map((n) => String(Number(n)));
function supported(text: string, evidence: string): boolean {
  const have = new Set(numbers(evidence));
  return numbers(text).every((n) => have.has(n));
}
const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");
const okIcon = (s: unknown) => (typeof s === "string" && ICONS.includes(s) ? s : "help");
function signKeys(words: unknown, vocab: any[] | undefined): string[] {
  if (!Array.isArray(words) || !vocab) return [];
  const byKey = new Map(vocab.map((v: any) => [v.k, v.k]));
  const byAr = new Map(vocab.map((v: any) => [v.ar, v.k]));
  return [...new Set(words.map((w) => (typeof w === "string" ? byKey.get(w.trim()) ?? byAr.get(w.trim()) : undefined)).filter(Boolean))].slice(0, 5) as string[];
}

function knowledgeFor(place: string | undefined) {
  const k = place ? KNOWLEDGE[place] : undefined;
  return k ? { place: k.name, facts: k.facts.map((f, i) => ({ id: "f" + (i + 1), fact: f.text, level: f.level })) } : { place: null, facts: [] };
}

function buildInput(task: string, p: any): unknown {
  if (task === "match") return JSON.stringify({ text: p.text, phrases: p.phrases.map((t: string, i: number) => `${i}: ${t}`) });
  if (task === "simplify") return JSON.stringify({ reply: p.text, vocabulary: p.vocab.map((v: any) => `${v.k}: ${v.ar}`) });
  if (task === "compose") return JSON.stringify({ signs: p.signs, goal: p.goal ?? null, amount: p.amount ?? null });
  const base: any = {
    goal: p.goal ?? null,
    KNOWLEDGE: knowledgeFor(p.place),
    vocabulary: (p.vocab || []).map((v: any) => `${v.k}: ${v.ar}`),
    icons: ICONS,
  };
  if (task === "next" || task === "summary" || task === "letter") Object.assign(base, { steps: p.steps || [], conversation: p.turns || [], facts_so_far: p.facts || [] });
  if (task === "summary") base.today = p.today;
  if (task === "letter" && p.want) base.paper_wanted = p.want;
  if (task !== "read") return JSON.stringify(base);
  return [
    { type: "image", source: { type: "base64", media_type: p.media_type, data: p.image } },
    { type: "text", text: JSON.stringify(base) },
  ];
}

function shape(task: string, out: any, p: any): any | null {
  const kText = knowledgeFor(p.place).facts.map((f) => f.fact).join(" ");
  const staff = (p.turns || []).filter((t: any) => t.who === "staff").map((t: any) => t.text).join(" ");
  const factsSoFar = (p.facts || []).map((f: any) => f.value).join(" ");

  if (task === "plan") {
    const kf = p.place ? KNOWLEDGE[p.place]?.facts || [] : [];
    const fact = (id: unknown) => (typeof id === "string" && /^f\d+$/.test(id) ? kf[Number(id.slice(1)) - 1] : undefined);
    // text may carry numbers only if its own cited fact carries them; "sure" only for an official cited fact
    const backed = (text: string, id: unknown) => supported(text, fact(id)?.text || "");
    const sure = (id: unknown) => fact(id)?.level === "official";
    if (!Array.isArray(out.steps) || out.steps.length < 1) return null;
    const steps = out.steps.slice(0, 5)
      .map((s: any) => ({ text: clip(s.text, 60), icon: okIcon(s.icon), ask: clip(s.ask, 160), from: s.from }))
      .filter((s: any) => s.text && backed(s.text, s.from))
      .map((s: any, i: number) => ({ id: "s" + (i + 1), text: s.text, icon: s.icon, ask: backed(s.ask, s.from) ? s.ask : "", sure: sure(s.from), status: "open" }));
    const bring = (Array.isArray(out.bring) ? out.bring : []).slice(0, 5)
      .map((b: any) => ({ text: clip(b.text, 50), icon: okIcon(b.icon), sure: sure(b.from), ok: backed(clip(b.text, 50), b.from) }))
      .filter((b: any) => b.text && b.ok).map(({ ok: _ok, ...b }: any) => b);
    const feeText = clip(out.fee?.text, 60);
    const fee = feeText && numbers(feeText).length && backed(feeText, out.fee?.from)
      ? { text: feeText, sure: sure(out.fee?.from) }
      : { text: "", sure: false };
    if (!steps.length) return null;
    return { title: clip(out.title, 50), steps, bring, fee, warn: supported(clip(out.warn, 100), kText) ? clip(out.warn, 100) : "", words: signKeys(out.words, p.vocab) };
  }

  if (task === "next") {
    const ids = new Set(p.steps.map((s: any) => s.id));
    const evidence = staff + " " + factsSoFar;
    const facts = (Array.isArray(out.facts) ? out.facts : []).slice(0, 4)
      .map((f: any) => ({ icon: okIcon(f.icon), label: clip(f.label, 30), value: clip(f.value, 60) }))
      .filter((f: any) => f.label && f.value && supported(f.value, evidence));
    const tell = clip(out.tell_customer, 120);
    return {
      done: (Array.isArray(out.progress) ? out.progress : []).filter((x: any) => x && x.state === "done" && ids.has(x.id)).map((x: any) => x.id),
      todo: (Array.isArray(out.progress) ? out.progress : []).filter((x: any) => x && x.state === "customer_todo" && ids.has(x.id)).map((x: any) => x.id),
      facts,
      ask_staff: supported(clip(out.ask_staff, 180), kText + " " + evidence) ? clip(out.ask_staff, 180) : "",
      tell_customer: supported(tell, kText + " " + evidence) ? tell : "",
      words: signKeys(out.words, p.vocab),
      replies: (Array.isArray(out.replies) ? out.replies : []).map((r: unknown) => clip(r, 30)).filter(Boolean).slice(0, 3),
      cards: (Array.isArray(out.cards) ? out.cards : []).slice(0, 3)
        .map((c: any) => ({ icon: okIcon(c.icon), text: clip(c.text, 24), word: signKeys([c.word], p.vocab)[0] || "" }))
        .filter((c: any) => c.text && supported(c.text, evidence)),
      finished: out.finished === true,
    };
  }

  if (task === "read") {
    const facts = (Array.isArray(out.facts) ? out.facts : []).slice(0, 5)
      .map((f: any) => ({ icon: okIcon(f.icon), label: clip(f.label, 30), value: clip(f.value, 60) }))
      // never show more than the last 4 digits of a long number (card, ID, account)
      .map((f: any) => ({ ...f, value: f.value.replace(/[\d٠-٩][\d٠-٩ -]{8,}[\d٠-٩]/g, (m: string) => "•••• " + latin(m).replace(/\D/g, "").slice(-4)) }))
      .filter((f: any) => f.label && f.value);
    return {
      kind: typeof out.kind === "string" ? out.kind : "other",
      title: clip(out.title, 60),
      facts,
      next: clip(out.next, 120),
      words: signKeys(out.words, p.vocab),
      unclear: out.unclear === true,
    };
  }

  if (task === "letter") {
    // numbers only from the official/news facts, what the staff said, or facts gathered in the visit; long numbers never appear
    const evidence = kText + " " + staff + " " + factsSoFar;
    const noLong = (t: string) => !/[\d٠-٩][\d٠-٩ -]{6,}[\d٠-٩]/.test(t);
    const lines = (Array.isArray(out.lines) ? out.lines : []).slice(0, 6)
      .map((l: unknown) => clip(l, 220)).filter((l: string) => l && supported(l, evidence) && noLong(l));
    if (lines.length < 2) return null;
    return {
      kind: p.want || (out.kind === "police_statement" ? "police_statement" : "request"),
      to: supported(clip(out.to, 80), evidence) ? clip(out.to, 80) : "",
      subject: supported(clip(out.subject, 80), evidence) ? clip(out.subject, 80) : "",
      lines,
    };
  }

  if (task === "summary") {
    const evidence = staff + " " + factsSoFar;
    const lines = (Array.isArray(out.lines) ? out.lines : []).slice(0, 5)
      .map((l: any) => ({ icon: okIcon(l.icon), text: clip(l.text, 70) }))
      .filter((l: any) => l.text && supported(l.text, evidence));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(out.remind?.date || "")) && staff ? String(out.remind.date) : "";
    return { title: clip(out.title, 40), lines, remind: { date, text: date ? clip(out.remind?.text, 60) : "" }, words: signKeys(out.words, p.vocab) };
  }
  return null;
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
  const EN = p?.lang === "en";
  const content = buildInput(task, p);
  const agent = AGENT_TASKS.includes(task);

  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), agent ? 25000 : 9000);
    let res = await ask(key, task, content, ctl.signal, false, EN);
    if (res.status === 200 && !res.out) res = await ask(key, task, content, ctl.signal, false, EN); // one retry on unparsable output
    clearTimeout(timer);
    if (res.status !== 200) return json({ fallback: true, reason: "upstream_" + res.status, detail: res.stop }, 200, h);
    const out = res.out;
    if (!out) return json({ fallback: true, reason: "parse", stop: res.stop }, 200, h);

    if (agent) {
      // some replies carry nested arrays/objects as JSON strings; parse them back
      for (const k of Object.keys(out)) {
        if (typeof out[k] === "string" && /^\s*[\[{]/.test(out[k])) { try { out[k] = JSON.parse(out[k]); } catch { /* keep */ } }
      }
      let shaped = shape(task, out, p);
      if (!shaped) {
        const ctl2 = new AbortController();
        const t2 = setTimeout(() => ctl2.abort(), 15000);
        const res2 = await ask(key, task, content, ctl2.signal, true, EN);
        clearTimeout(t2);
        if (res2.status === 200 && res2.out) shaped = shape(task, res2.out, p);
        if (shaped) return json({ ...shaped, backup: true }, 200, h);
      }
      if (shaped) return json(shaped, 200, h);
      return json({ fallback: true, reason: "shape", ...(p.debug === true ? { raw: out } : {}) }, 200, h);
    }
    if (task === "compose") {
      if (typeof out.text !== "string" || !out.text.trim() || out.text.length > 160) return json({ fallback: true, reason: "shape" }, 200, h);
      // guard: the sentence may not say more than the signs. Identity/greeting signs are returned as signed;
      // a sentence far longer than the signs falls back to the signs themselves.
      const signs = (p.signs as string[]).map((x) => x.trim()).filter(Boolean);
      const plain = signs.join(" ") + ".";
      if (signs.every((x) => COMPOSE_PLAIN.includes(x))) return json({ text: plain, guarded: true }, 200, h);
      const t = out.text.trim();
      if (t.split(/\s+/).length > signs.length * 5 + 6) return json({ text: plain, guarded: true }, 200, h);
      return json({ text: t }, 200, h);
    }
    if (task === "simplify") {
      const t = typeof out.text === "string" ? out.text.trim() : "";
      if (!t || t.length > 120) return json({ fallback: true, reason: "shape" }, 200, h);
      return json({ text: t, words: signKeys(out.words, p.vocab) }, 200, h);
    }
    const i = Number(out.index);
    if (!Number.isInteger(i) || i < -1 || i >= p.phrases.length) return json({ fallback: true, reason: "shape" }, 200, h);
    return json({ index: i }, 200, h);
  } catch (_e) {
    return json({ fallback: true, reason: "error" }, 200, h);
  }
});
