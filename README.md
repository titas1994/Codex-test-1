# AI Thumbnail Studio (No Login)

A no-login web app for generating multiple thumbnail variations quickly with AI-style composition and session-based workflows.

## Implemented Features

- Text → thumbnail generation with style presets (YouTube, gaming, cinematic, minimal).
- Image/reference uploads.
- Video upload + automatic key-frame extraction.
- YouTube link support (uses video thumbnail as reference).
- Multi-variation generation (4–10 variants per run).
- CTR helper panel:
  - hook text suggestions,
  - click potential score,
  - optimization hints.
- Smart editor controls:
  - text size,
  - stroke,
  - shadow,
  - contrast,
  - one-click assist buttons.
- A/B comparison gallery with selectable variant.
- Multi-platform resize:
  - YouTube
  - YouTube Shorts
  - Instagram/Reels
  - TikTok
- Session-based storage (restores latest generated variants in current browser session).
- Export selected or download all in PNG/JPG/WebP.

## Local run

```bash
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## Netlify

- Publish directory: `.`
- Build command: *(empty)*

Routing files included:
- `_redirects`
- `netlify.toml`
