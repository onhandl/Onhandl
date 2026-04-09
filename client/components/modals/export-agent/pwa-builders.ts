import JSZip from 'jszip';

export async function buildPwaZip(agentConfig: any, agentName: string): Promise<JSZip> {
  const zip = new JSZip();
  zip.file('agent-config.json', JSON.stringify(agentConfig, null, 2));
  zip.file('manifest.json', JSON.stringify(buildManifest(agentName), null, 2));
  zip.file('sw.js', buildServiceWorker(agentName));
  zip.file('index.html', buildIndexHtml(agentConfig, agentName));
  return zip;
}

function buildManifest(agentName: string) {
  return {
    name: agentName, short_name: agentName.substring(0, 12),
    description: `${agentName} — powered by Onhandl`,
    start_url: '/', display: 'standalone',
    background_color: '#09090b', theme_color: '#7c3aed',
    icons: [
      { src: 'https://placehold.co/192x192/7c3aed/ffffff?text=AI', sizes: '192x192', type: 'image/png' },
      { src: 'https://placehold.co/512x512/7c3aed/ffffff?text=AI', sizes: '512x512', type: 'image/png' },
    ],
  };
}

function buildServiceWorker(agentName: string) {
  const cacheName = agentName.toLowerCase().replace(/\s+/g, '-') + '-v1';
  return `// ${agentName} PWA — Service Worker
const CACHE_NAME = '${cacheName}';
const SHELL = ['/index.html'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) { e.respondWith(fetch(e.request)); }
  else { e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request))); }
});`;
}

function buildIndexHtml(agentConfig: any, agentName: string) {
  const apiUrl = (agentConfig.apiUrl || 'http://localhost:3001/api').replace(/\/$/, '');
  const agentId = agentConfig.id;
  const bio = agentConfig.character?.bio || agentConfig.description || '';
  const chatEndpoint = `${apiUrl}/embed/agent/${agentId}/chat`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${agentName}</title><meta name="theme-color" content="#7c3aed" />
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;color:#fafafa;display:flex;flex-direction:column;height:100dvh}
    header{padding:14px 16px;background:#18181b;border-bottom:1px solid #27272a;display:flex;align-items:center;gap:10px}
    .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0}
    .agent-info h1{font-size:15px;font-weight:600}.agent-info p{font-size:12px;color:#71717a}
    #messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
    .msg{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5}
    .msg.user{align-self:flex-end;background:#7c3aed;color:#fff;border-bottom-right-radius:4px}
    .msg.agent{align-self:flex-start;background:#27272a;color:#fafafa;border-bottom-left-radius:4px}
    .msg.thinking{color:#71717a;font-style:italic}
    form{padding:12px 16px;background:#18181b;border-top:1px solid #27272a;display:flex;gap:8px}
    textarea{flex:1;resize:none;background:#27272a;border:1px solid #3f3f46;color:#fafafa;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;outline:none;max-height:120px}
    textarea:focus{border-color:#7c3aed}
    button[type=submit]{background:#7c3aed;color:#fff;border:none;border-radius:10px;padding:0 16px;font-size:14px;font-weight:600;cursor:pointer;min-width:64px;transition:background .15s}
    button[type=submit]:disabled{background:#52525b;cursor:not-allowed}
    button[type=submit]:hover:not(:disabled){background:#6d28d9}
  </style>
</head>
<body>
  <header>
    <div class="avatar">${agentName.charAt(0).toUpperCase()}</div>
    <div class="agent-info"><h1>${agentName}</h1><p>${bio.substring(0, 80)}${bio.length > 80 ? '…' : ''}</p></div>
  </header>
  <div id="messages"><div class="msg agent">Hi! I'm ${agentName}. How can I help you today?</div></div>
  <form id="chat-form">
    <textarea id="input" placeholder="Message ${agentName}…" rows="1"></textarea>
    <button type="submit" id="send-btn">Send</button>
  </form>
  <script>
    if ('serviceWorker' in navigator && location.protocol !== 'null:' && location.protocol !== 'about:') { navigator.serviceWorker.register('/sw.js').catch(() => {}); }
    const CHAT_ENDPOINT = '${chatEndpoint}';
    const SESSION_ID = 'pwa_${agentId}_' + Date.now();
    const messagesEl = document.getElementById('messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send-btn');
    function appendMsg(role, text) { const div = document.createElement('div'); div.className = 'msg ' + role; div.textContent = text; messagesEl.appendChild(div); messagesEl.scrollTop = messagesEl.scrollHeight; return div; }
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const prompt = input.value.trim(); if (!prompt) return;
      input.value = ''; appendMsg('user', prompt); sendBtn.disabled = true;
      const thinking = appendMsg('agent thinking', 'Thinking…');
      try {
        const res = await fetch(CHAT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, sessionId: SESSION_ID }) });
        thinking.remove(); if (!res.body) throw new Error('No response body');
        const reader = res.body.getReader(); const decoder = new TextDecoder(); const msgEl = appendMsg('agent', ''); let buf = '';
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          buf += decoder.decode(value, { stream: true }); const lines = buf.split('\\n'); buf = lines.pop() || '';
          for (const line of lines) { if (!line.startsWith('data:')) continue; try { const data = JSON.parse(line.slice(5).trim()); const token = data.token ?? data.content ?? data.text ?? ''; if (token) { msgEl.textContent += token; messagesEl.scrollTop = messagesEl.scrollHeight; } } catch {} }
        }
      } catch (err) { thinking.remove(); appendMsg('agent', 'Sorry, something went wrong.'); console.error(err); }
      finally { sendBtn.disabled = false; input.focus(); }
    });
  </script>
</body>
</html>`;
}
