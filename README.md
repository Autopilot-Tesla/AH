```
Discord AI - Static (No Build)

What you have
- index.html — single-page static app (Tailwind CDN used).
- app.js — full app logic in plain vanilla JavaScript (no React, no build).
- README (this file).

How to deploy (no terminal required)
1. Put the two files (index.html and app.js) in a folder.
2. Upload that folder to your static web host (GitHub Pages, Netlify drop, Vercel static, S3 bucket, Google Drive web hosting, etc.).
3. Open the URL in a browser.

How to use
- The app starts in AI/simulated mode by default. Enter a Display Name and click "Start AI Chat".
- To use real Discord:
  - Click "Real Discord" on the login modal.
  - Paste your Discord token into "User Token".
  - If you run into CORS errors, provide a CORS proxy prefix (e.g. https://corsproxy.io/?).
  - Click "Login to Discord".
  - Note: Using user tokens from the browser may violate Discord ToS and can be unsafe — proceed at your own risk.

Notes & limitations
- This is a simplified, static conversion of your .tsx UI into plain HTML + JS. It aims to behave similarly but is not a full React port.
- Icons are replaced by emoji where convenient to avoid external icon libs.
- The Discord API calls are done directly from the browser and are subject to CORS and Discord policy. For production use, run API calls server-side (with a bot token) and proxy requests securely.
- No build tools or terminal needed.

If you want:
- I can produce a ZIP of these files (ready to upload) or a few small improvements (persisting active channel across sessions, nicer icons, or adding optional hosted proxy sample).
