J.A.R.V.I.S EP06 - Gemini primary + OpenRouter Free fallback

Changes:
- Existing EP01-EP05 script logic preserved; script.js changed only to add provider fallback.
- Gemini remains primary when a Gemini key is present.
- If Gemini request fails (quota, rate limit, server error, etc.), OpenRouter Free is attempted automatically.
- If Gemini key is absent, OpenRouter Free can be used directly.
- Vision requests also use the same fallback path.
- OpenRouter key is stored in browser localStorage only.

Setup:
1. Open the app.
2. Put your Gemini key if you have one. It is optional if using OpenRouter fallback.
3. Put your OpenRouter API key in the OpenRouter field.
4. Save keys.
5. Test: hello. If Gemini fails, the app attempts OpenRouter Free.

Important:
- A fallback key cannot be magically created by the app. The user must provide an OpenRouter API key.
- OpenRouter Free uses the model id openrouter/free and its current free-model router.
- This browser-only architecture exposes API keys to the browser; for a public production deployment, use a backend proxy.
