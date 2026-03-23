# AI YouTube Thumbnail Generator

A simple web app to generate YouTube thumbnails with AI. It also supports uploading your own image and gives both input and output preview areas.

## Features

- AI thumbnail generation from your video topic.
- Optional image upload with instant input preview.
- Output image preview and one-click download.
- Clean, beginner-friendly UI.

## Run locally

Because this is a static app, you can serve it with any static server:

```bash
python3 -m http.server 8080
```

Then open:

- http://localhost:8080

## Deploy on Netlify (for testing and live)

### Option 1: Drag-and-drop deploy (fastest)

1. Zip this project folder.
2. Go to **Netlify > Sites**.
3. Drag the zip into Netlify deploy area.
4. Netlify will publish a live URL in seconds.

### Option 2: Connect GitHub repo (recommended)

1. Push this code to a GitHub repository.
2. In Netlify, click **Add new site > Import an existing project**.
3. Select GitHub and choose your repo.
4. Use these build settings:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.`
5. Click **Deploy site**.

## Make it production-ready later

If you need stronger quality and brand-consistent designs, replace the free image API with your own provider key through a backend function.

## Notes

- The app currently uses a free public image generation endpoint (`image.pollinations.ai`) for easy testing.
- Generation speed and quality may vary depending on public API load.
