# AI Thumbnail Studio (Production MVP, No Login)

This is a real-world static + serverless thumbnail generator:
- Frontend: static web app
- Backend: Netlify Function (`/.netlify/functions/generate-thumbnail`)
- AI engine: OpenAI Images API (`gpt-image-1`)

## What works now

- Prompt → AI thumbnail generation
- Style presets (YouTube High CTR, Cinematic, Gaming, Minimal)
- Multi-platform output sizes:
  - YouTube 1280×720
  - Shorts/TikTok 1080×1920
  - Instagram 1080×1350
- Multi-variation generation (1–4)
- Download selected/all in PNG, JPG, or WebP
- No signup/login flow

## Environment setup (required)

Set this env var in Netlify:

- `OPENAI_API_KEY`

Without it, generation will return a clear server error.

## Local development

### Option A (frontend only)
```bash
python3 -m http.server 8080
```

### Option B (full stack with function)
Use Netlify CLI so the function runs locally.

```bash
netlify dev
```

## Netlify deploy

- Build command: *(empty)*
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Environment variable: `OPENAI_API_KEY`

## Notes

- This implementation is production-oriented compared with pure client-side mock generation.
- Keep API keys only in server-side env vars (never in frontend JS).
