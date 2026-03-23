# AI YouTube Thumbnail Generator

A simple web app to generate YouTube thumbnails with AI. It supports uploading your own image, previewing that input, and previewing/downloading the final thumbnail.

## Features

- Generate an AI thumbnail background from your video topic (with automatic local fallback if API is busy).
- Upload your own image and preview it instantly.
- Auto-compose the final thumbnail with:
  - AI background,
  - large headline text,
  - optional uploaded creator image.
- Preview and download the final image.
- Clean and beginner-friendly UI.

## Run locally

Because this is a static app, you can serve it with any static server:

```bash
python3 -m http.server 8080
```

Open:

- http://localhost:8080

## Deploy on Netlify (testing + live)

### Option 1: Drag-and-drop deploy (fastest)

1. Zip this project folder.
2. In Netlify, go to **Sites**.
3. Drag your zip into the deploy area.
4. Wait for deploy to finish and open the generated URL.

### Option 2: GitHub import (recommended)

1. Push this code to a GitHub repo.
2. In Netlify, click **Add new site → Import an existing project**.
3. Choose your repository.
4. Set:
   - **Base directory:** *(leave empty)*
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.`
5. Deploy.

## If you see “Page not found” on Netlify

Use this checklist:

1. Confirm deploy completed successfully in Netlify logs.
2. Confirm **Publish directory** is exactly `.`.
3. Confirm `index.html` is in the project root.
4. Re-deploy with **Clear cache and deploy site**.
5. Open the site root URL (for example, `https://your-site.netlify.app/`) instead of a subpath.

This repo already includes both `netlify.toml` and `_redirects` for SPA/static fallback routing.

## Notes

- The app uses a free public image generation endpoint (`image.pollinations.ai`) for easy testing.
- Public API speed/quality can vary depending on current traffic.
- If the AI endpoint is unavailable, the app creates a local template thumbnail so users still get output.
