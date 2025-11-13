// background service worker for the extension
// Listens for messages from the popup and forwards API calls to the local FastAPI server.

// Helper to perform fetch and return JSON or an error object
async function forwardRequest(path, options = {}) {
	const base = 'http://localhost:8000';
	const url = `${base}${path}`;

	try {
		const res = await fetch(url, options);
		const text = await res.text();
		// Try parse JSON when possible
		try {
			return { status: res.status, ok: res.ok, body: JSON.parse(text) };
		} catch (err) {
			return { status: res.status, ok: res.ok, body: text };
		}
	} catch (err) {
		return { status: 0, ok: false, error: String(err) };
	}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	(async () => {
		if (!message || !message.type) {
			sendResponse({ ok: false, error: 'invalid_message' });
			return;
		}

			if (message.type === 'ask') {
				const payload = message.payload || {};
				const headers = { 'Content-Type': 'application/json' };
				if (payload.friend_token) {
					headers['X-Friend-Token'] = payload.friend_token;
				}
				const options = {
					method: 'POST',
					headers,
					body: JSON.stringify({ session_id: payload.session_id, question: payload.question }),
				};

				const result = await forwardRequest('/ask', options);
				sendResponse(result);
				return;
			}

		if (message.type === 'health') {
			const result = await forwardRequest('/health', { method: 'GET' });
			sendResponse(result);
			return;
		}

				if (message.type === 'reindex') {
					const token = message.payload && (message.payload.friend_token || message.payload.admin_token);
					const headers = { 'Content-Type': 'application/json' };
					if (token) {
						headers['X-Friend-Token'] = token;
					}
					const options = { method: 'POST', headers };
					const result = await forwardRequest('/admin/reindex', options);
					sendResponse(result);
					return;
				}

		sendResponse({ ok: false, error: 'unknown_type' });
	})();

	// Return true to indicate we'll call sendResponse asynchronously
	return true;
});
