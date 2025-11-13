// popup.js - updated clean chat UI

// -------------------------------
// ELEMENT SHORTCUTS
// -------------------------------
const $ = id => document.getElementById(id);
const messagesEl = $('messages');
const questionEl = $('question');
const sendBtn = $('send');
const reindexBtn = $('reindex');
const healthEl = $('health');


// -------------------------------
// SESSION ID
// -------------------------------
function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

function getSessionId() {
	let s = localStorage.getItem('session_id');
	if (!s) { s = uuidv4(); localStorage.setItem('session_id', s); }
	return s;
}


// -------------------------------
// MESSAGE RENDERING
// -------------------------------
function appendMessage(text, who='bot') {
	const wrap = document.createElement('div');
	wrap.className = 'msg ' + (who === 'user' ? 'user' : '');

	const bubble = document.createElement('div');
	bubble.className = 'bubble ' + (who === 'user' ? 'user' : 'bot') + ' entrance';

	bubble.textContent = text;
	wrap.appendChild(bubble);

	messagesEl.appendChild(wrap);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendBotMessage(answer, sources = []) {
	const wrap = document.createElement('div');
	wrap.className = 'msg bot';

	const bubble = document.createElement('div');
	bubble.className = 'bubble bot entrance';

	const ansDiv = document.createElement('div');
	ansDiv.className = 'answer';
	ansDiv.textContent = answer;

	bubble.appendChild(ansDiv);

	// Add separated sources block with clickable links
	if (sources.length > 0) {
		const srcDiv = document.createElement('div');
		srcDiv.className = 'sources';
		
		const label = document.createElement('strong');
		label.textContent = 'Sources';
		srcDiv.appendChild(label);

		sources.forEach(src => {
			const link = document.createElement('a');
			link.href = src;
			link.className = 'source-link';
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			
			// Extract filename or use full URL
			const parts = src.split('/');
			const filename = parts[parts.length - 1] || src;
			link.textContent = decodeURIComponent(filename);
			
			srcDiv.appendChild(link);
		});

		bubble.appendChild(srcDiv);
	}

	wrap.appendChild(bubble);
	messagesEl.appendChild(wrap);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}


// -------------------------------
// LOADER
// -------------------------------
function appendLoader() {
	const wrap = document.createElement('div');
	wrap.className = 'msg';
	wrap.dataset.loader = '1';

	const bubble = document.createElement('div');
	bubble.className = 'bubble bot loader-bubble entrance';

	const grad = document.createElement('div');
	grad.className = 'loader-gradient';

	const dots = document.createElement('div');
	dots.className = 'loader-dots';

	for (let i = 0; i < 3; i++) {
		const d = document.createElement('div');
		d.className = 'dot';
		dots.appendChild(d);
	}

	bubble.appendChild(grad);
	bubble.appendChild(dots);
	wrap.appendChild(bubble);

	messagesEl.appendChild(wrap);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeLoader() {
	const last = messagesEl.querySelectorAll('.msg');
	for (let i = last.length - 1; i >= 0; i--) {
		const n = last[i];
		if (n && n.dataset && n.dataset.loader === '1') {
			n.remove();
			return;
		}
	}
}


// -------------------------------
// BACKGROUND MESSAGING
// -------------------------------
async function callBackground(type, payload = {}) {
	return new Promise(resolve => {
		chrome.runtime.sendMessage({ type, payload }, response => {
			resolve(response);
		});
	});
}


// -------------------------------
// SEND QUESTION
// -------------------------------
async function sendQuestion() {
	const q = questionEl.value.trim();
	if (!q) return;

	appendMessage(q, 'user');
	questionEl.value = '';

	const session_id = getSessionId();

	appendLoader();
	const res = await callBackground('ask', { question: q, session_id });
	removeLoader();

	if (!res) {
		appendMessage('No response from background', 'bot');
		return;
	}

	if (!res.ok) {
		appendMessage('Error: ' + (res.error || JSON.stringify(res)), 'bot');
		return;
	}

	// expected server JSON in res.body
	const body = res.body || {};

	const answer = body.answer || body.response || 'No answer received.';
	const sources = body.sources || [];

	appendBotMessage(answer, sources);
}


// -------------------------------
// EVENTS
// -------------------------------
sendBtn.addEventListener('click', sendQuestion);
questionEl.addEventListener('keydown', e => {
	if (e.key === 'Enter') sendQuestion();
});


// -------------------------------
// REINDEX
// -------------------------------
reindexBtn.addEventListener('click', async () => {
	appendLoader();
	const res = await callBackground('reindex');
	removeLoader();

	if (!res) {
		appendMessage('No response', 'bot');
		return;
	}

	if (!res.ok) {
		appendMessage('Error: ' + (res.error || JSON.stringify(res)), 'bot');
		return;
	}

	appendBotMessage('Reindex complete.', []);
});


// -------------------------------
// HEALTH CHECK
// -------------------------------
async function checkHealth() {
	healthEl.textContent = '…';

	const res = await callBackground('health');
	if (res && res.ok && res.body && res.body.ok) {
		healthEl.textContent = 'online';
	} else {
		healthEl.textContent = 'offline';
	}
}

checkHealth();
