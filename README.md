# AI Thumbnail Studio

A modern, glass-style thumbnail generator web app for YouTube and Instagram. Users can generate realistic AI thumbnail images, upload their own photo, add an optional reference image, preview everything, and download the output.

## Features

- Realistic AI image generation via prompt-based model endpoint.
- Optional **Your image** upload preview.
- Optional **Reference image** preview (for creative guidance in prompt).
- Output aspect ratio selector:
  - YouTube (16:9)
  - YouTube Shorts (9:16)
  - Instagram Post (1:1)
  - Instagram Story/Reel (9:16)
- AI output preview + download button.
- Automatic local fallback thumbnail if AI server is temporarily unavailable.
- Modern minimal liquid-glass UI.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy on Netlify

### Quick drag-and-drop

1. Zip the project folder.
2. Go to Netlify → Sites.
3. Drag and drop zip.
4. Open generated URL.

### GitHub import (recommended)

1. Push repo to GitHub.
2. Netlify → Add new site → Import existing project.
3. Choose repo.
4. Build settings:
   - Base directory: empty
   - Build command: empty
   - Publish directory: `.`
5. Deploy.

## If Netlify shows “Page not found”

1. Confirm publish directory is `.`.
2. Confirm `index.html` is in repo root.
3. Re-deploy with cache clear.
4. Use the root URL only.

Routing fallback is included using both `_redirects` and `netlify.toml`.

## Notes

- This app uses a public AI endpoint (`image.pollinations.ai`), so occasional slowdowns can happen.
- If AI generation fails, the app automatically builds a clean fallback thumbnail so users still get downloadable output.
