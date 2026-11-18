# Maak Sign (معاك)

**Maak Sign lets deaf Egyptians talk to any bank teller in Egyptian Sign Language.**
The customer signs to their phone; the agent turns the signs into a clear Arabic request the customer confirms; the teller answers from their own screen; the reply comes back as sign-language video.

Entry for the Dubai Create AI Agents Championship, category **Best Societal AI Agent**.

**Live prototype:** https://waelabdlrahman16-ux.github.io/maak-sign/
**Teller screen:** https://waelabdlrahman16-ux.github.io/maak-sign/#teller

## How it works

1. **Sign recognition on the phone.** The camera feed is processed on the device. Hand, arm and body landmarks are extracted per frame, normalised for position, scale and handedness, and segmented into individual signs by timing (hand raised, held, lowered).
2. **Matching.** Each sign is compared with known examples using dynamic time warping. The app ships with built-in examples for 24 signs (62 examples from 15+ signers), and each user can teach it their own way of signing, which then takes priority.
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

**Original to this project:** the product and interaction design, all screens and flows, the sign segmentation, feature normalisation and matching logic, the customer–teller protocol, and the banking sign vocabulary and phrases. The sign videos in `clips/` are prototype references and will be replaced by recordings from deaf volunteer signers.

**Open data used:** sign examples and the `clips/kg_*.mp4` videos (need, help, where, sorry, fine, how are you, what is your name, thanks) come from the Kaggle dataset *Arabic Sign Language (ArSL) for Words* by Eslam Ezzat, released under CC0 (public domain), recorded by Egyptian signers. On signers held out from the examples, the matcher picks the right sign 81% of the time across these 8 words.

**Open-source tools used:**

| Tool | Use | Licence |
|---|---|---|
| [Google MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) (Holistic Landmarker) — `vendor/`, `models/` | Hand, pose and face landmark extraction on the device | Apache-2.0 |
| [Supabase Realtime](https://supabase.com) via `@supabase/supabase-js` | Live relay that pairs the customer and teller screens | MIT |
| [qrcodejs](https://github.com/davidshimjs/qrcodejs) | Pairing QR code | MIT |
| Material Symbols, Noto Sans Arabic (Google Fonts) | Icons and type | Apache-2.0 / OFL |

## Status

Working prototype. Next: recognition trained on many signers, a language agent that turns signs into natural sentences and matches teller replies by meaning, and testing with deaf customers.

Designed and built by Wael Abdlrahman.
