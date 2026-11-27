# Maak Sign (معاك)

**Maak Sign lets deaf Egyptians talk to any bank teller in Egyptian Sign Language.**
The customer signs to their phone; the agent turns the signs into a clear Arabic request the customer confirms; the teller answers from their own screen; the reply comes back as sign-language video.

Entry for the Dubai Create AI Agents Championship, category **Best Societal AI Agent**.

**Live prototype:** https://maaksign.com/
**Agent (new):** https://maaksign.com/agent/

## The agent

Maak also gets a task done for a deaf person at any service counter: a bank, the civil registry, a Social Solidarity office or a hospital.

1. **Goal.** The person taps a picture (lost bank card, lost national ID, Takaful and Karama, integrated services card, a doctor visit).
2. **Plan.** Claude plans the visit from a small knowledge pack of facts with sources: steps, the question to ask the staff at each step, what to bring, and the fee. Facts from the provider's own website are marked ✓; anything else becomes a question for the staff. Phone-only services (for example a card stop through Banque Misr's 19888 line) become a request for the staff to do it.
3. **At the counter.** The phone shows the staff Maak's question; the staff types or speaks the answer. Claude ticks off steps, records the facts the staff gave, marks what the customer still has to do, asks the next question, and tells the customer in short words with signs. The customer answers with a tap or by signing (the sign reader runs on the phone).
4. **Papers.** The person photographs a receipt or form; Claude reads it and explains it in simple words. The photo is used once and not stored; long card, ID and account numbers show only their last 4 digits.
5. **Summary.** What was done, the fee, the pickup date and a calendar reminder.

**Honesty rule, enforced in code:** every number the agent shows must appear in a cited official fact or in what the staff said; anything else is removed before it reaches the screen.
**Agent page:** https://maaksign.com/agent/ · **Teller screen:** https://maaksign.com/staff

### Agent actions

| Action | What it does | Privacy |
|---|---|---|
| **Write the paper** | Drafts the paper the customer hands to the staff: a request to the branch or office, or (lost national ID) a statement for the police station. It says the customer is deaf and asks for written replies. Show on screen or print. | Only the goal, the staff's replies and the visit facts go to the agent. The customer's name is added on the phone and never sent. The national ID and card number lines stay blank to fill in by hand; long numbers are blocked by the server. The agent may not claim anything was paid or done unless the staff said so. |
| **Find the place** | Opens Google Maps searching for the right kind of place (Banque Misr branch, civil registry, social unit, public hospital). | Nothing is sent by Maak; Maps uses the phone's own location. |
| **Remember the case** | Unfinished visits and pending pickups show at the top of the agent page, with "got it" and "going to pick it up" (starts the next visit with the earlier facts). | Kept on the phone. "Save a copy" encrypts the cases on the phone (AES-GCM, key derived from a 10-character code with PBKDF2) and stores only the locked bytes; the server never sees the code or anything readable. Copies are deleted after 180 days. |
| **Follow up by itself** | On the pickup date, a phone notification ("today is your date… did you get it?"); tapping it opens the case. | The server keeps only the browser's push address, the date, a random case id and a short generic text: no names, numbers or bank details. Sent jobs are deleted after 7 days. iPhone needs "Add to Home Screen". |

**Server pieces** (Supabase project "Maak Sign"): edge functions `maak-agent` (plan, next, read, letter, summary, compose, match, simplify), `maak-case` (stores and returns locked case copies) and `maak-push` (signing key, push jobs, daily send). Tables `case_backups`, `push_keys` and `push_jobs` have row-level security on and no public access; only the functions read them. A daily database job (`maak-push-daily`, 08:47 Cairo) sends the due notifications.

## How it works

1. **Sign recognition on the phone.** The camera feed is processed on the device. Hand, arm and body landmarks are extracted per frame, normalised for position, scale and handedness, and segmented into individual signs by timing (hand raised, held, lowered).
2. **Matching.** Each sign is compared with known examples using dynamic time warping. The app ships with built-in examples for all 39 of its signs (380 examples: the 7 public-domain customer signs have 45 examples each, drawn from all 15 signers; the other 32 signs come from one signer each and are not yet tested on new signers), and each user can teach it their own way of signing, which then takes priority.
3. **Sentence and confirmation.** Recognised signs become a short Arabic request (e.g. *I want to withdraw 2,000 EGP*). The customer confirms before anything is sent. If a sign is unclear, the customer picks the word from a picture list instead of the agent guessing.
4. **Teller pairing.** The customer's phone shows a six-digit code; the teller types it (or opens a link) and both screens connect. No install and no account for the teller.
5. **Reply in sign.** The teller taps a reply; the customer sees it as a sign-language video with the text underneath.

## Privacy

- Video never leaves the phone. Only the confirmed text request and the teller's reply travel between devices.
- Taught signs are stored only in the user's own browser.
- Designed for Egypt's Personal Data Protection Law (Law 151 of 2020).

## Built for people who may not read

Right-to-left Arabic, icons and sign videos on every screen, a "explain this screen in sign" button everywhere, large touch targets and a picture-based word picker.

## What is original and what is borrowed

**Original to this project:** the product and interaction design, all screens and flows, the sign segmentation, feature normalisation and matching logic, the customer–teller protocol, and the banking sign vocabulary and phrases. Every sign video shown in the app is openly licensed (see below). Signs without an open-licence video yet show the word and an icon; recordings from deaf volunteer signers will fill those gaps.

**Open data used:** sign examples and the `clips/kg_*.mp4` videos (need, help, where, sorry, fine, how are you, what is your name, thanks) come from the Kaggle dataset *Arabic Sign Language (ArSL) for Words* by Eslam Ezzat, released under CC0 (public domain), recorded by Egyptian signers. The customer side recognises 7 of these words ("what is your name" is only used as a teller reply video). Tested by leaving out one signer at a time (15 signers, 732 clips of these 7 signs; the left-out signer's clips never appear among the examples), the app picks the right sign 91% of the time while choosing among all 39 signs (95% range: 89–93%). About 1 time in 7 it is unsure and asks the customer to pick from its top 3; the right sign is in that top 3 97% of the time, so when the customer picks correctly the right word ends up in the sentence 95% of the time, and a wrong word slips through 2% of the time. Weakest sign: "how are you" (79%). The other 32 signs are not yet tested on new signers; on the one card sign we could test with a second signer (lost-card replacement), it was confused with damaged-card replacement every time. The matching settings and the number of examples were chosen on these same clips, so new signers may score a little lower.

**Numbers 0–10 (added 27 Nov 2026):** hand-point examples come from the Kaggle dataset *Arabic Sign Language (ArSL) for numbers* by Eslam Ezzat's team (Faculty of Computers and Artificial Intelligence, Beni Suef University), released under CC0 (public domain) and described as Egyptian Sign Language. It has one signer, so the numbers are **not yet tested on new signers**. On later, unseen parts of the same signer's recording, the right number comes first 84.6% of the time (52 clips). With the 11 numbers added (50 signs in all), the 7-word test above still gives 90.8% (was 91.0%) with the same 2.3% wrong slips. No number images are shown in the app.

**Update 27 Nov 2026: 15 words, copies removed, context from the agent.** The Kaggle words set contains 63 clips that are exact file copies of other clips; with them removed (669 clips), the 7-word result above is **89.7%** right first, 93.7% right after the ask step, 2.8% wrong slips (not 91% / 95% / 2.3%). Maak now uses all 15 words of the set (adds hospital, what's your name, club, father, mother, learn, love, school; 1,321 clips, 15 signers) and keeps every clip as an example (hand points only). The signers of the 8 added words were matched by clothing colour against the hand-labelled clips (this matching was right 96% of the time on the labelled words). Two changes keep wrong guesses low: (1) the agent's goal tells the reader where the customer is (bank, hospital, government office), and signs that don't fit that place are made slightly less likely (distance x1.1); (2) the app asks «did you mean?» more often (when the best distance is above 58 or the top two are within 18%). Leaving out one signer at a time, on signs that fit the place: bank 89.2% right first, 1.5% wrong slips, 94.5% end right; hospital 89.4%, 1.6%, 94.7%; government office 90.1%, 1.2%, 95.2%. The cost: the app asks the customer to pick from 3 about 30% of the time (was about 14%). With no place known: 86.5% right first, 1.7% wrong slips. These settings were chosen on the same clips, so new signers may score a little lower.

**Open-source tools used:**

| Tool | Use | Licence |
|---|---|---|
| [Google MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) (Holistic Landmarker) — `vendor/`, `models/` | Hand, pose and face landmark extraction on the device | Apache-2.0 |
| [Supabase Realtime](https://supabase.com) via `@supabase/supabase-js` | Live relay that pairs the customer and teller screens | MIT |
| [qrcodejs](https://github.com/davidshimjs/qrcodejs) | Pairing QR code | MIT |
| Material Symbols, Noto Sans Arabic (Google Fonts) | Icons and type | Apache-2.0 / OFL |

## Status

Working prototype with a live agent. Next: testing with deaf users, more official facts per place, and more signs from deaf signers.

Designed and built by Wael Abdlrahman.
