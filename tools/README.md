# Maak working tools (not part of the site)
- `qa/` — Playwright UI tests (agent page, actions, home, staff) and feature extraction (`kgfull.js`, `compfeat.js`) that runs the app's own recognizer on video files. Paths inside point to the session scratchpad; adjust before running.
- `eval/` — recognition tests: `evalfull.js` (leave-one-signer-out, 91%/95%), `onehand3.js` (one-handed signing), `rej_eval5.js` + `build_rej.js` (not-one-of-my-signs), `apptest_*.js` (app code = tested formula).
- `figma/prelude.js` — helper prelude for use_figma scripts on the "Maak Screens" file.
- Feature data (landmark JSON, ~43 MB) is kept privately in the Dubai folder: `_work/maak_eval_data/`.
