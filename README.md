# University RAG Chat - Extension

This extension provides a small popup UI that talks to a local FastAPI server (University RAG Chat) running on http://localhost:8000. The extension sends requests to the `/ask` endpoint and displays answers.

Quick steps

1. Start your FastAPI server (example using uvicorn):

```powershell
# from the project containing `app` module
python -m uvicorn app.main:app --reload --port 8000
```

2. Load the extension into Chrome/Edge:
- Open chrome://extensions (or edge://extensions)
- Enable "Developer mode"
- Click "Load unpacked" and select the extension folder `ChatExtension` (this folder). Note: the extension manifest is `manifest.json`.

3. Open the extension popup and ask a question.

Notes
- The popup communicates with the background service worker which forwards requests to `http://localhost:8000`. Ensure your FastAPI server accepts requests from the extension or otherwise permits CORS if necessary.
- If you need a token for `/admin/reindex`, the popup now includes a "Friend token (optional)" input which will be sent as the `X-Friend-Token` header when you click Reindex or when sending `/ask` requests.

Styling and UI
- The popup uses a glass-like theme and shows an animated gradient loader while the server is "thinking". The loader appears as an animated gradient bubble with moving dots.

Files changed/added
- `popup.html` — popup UI and controls
- `popup.js` — UI logic and messaging
- `background.js` — service worker that forwards /ask, /health, /admin/reindex calls to localhost

If you'd like, I can:
- Add a settings input to configure host/port and admin token
- Add nicer message formatting and streaming answers
- Make the extension resilient to CORS by adding optional proxying or adjusting server CORS
