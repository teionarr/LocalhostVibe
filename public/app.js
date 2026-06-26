// Control room frontend: pull config, stream live events, keep stats fresh,
// and hide a couple of easter eggs for the curious.

const $ = (id) => document.getElementById(id);
const PREFIX = location.pathname.replace(/\/$/, ''); // e.g. /_vibe

let startedAt = Date.now();
const VIBE_LINES = [
  'the localhost stays in the room. the link does not.',
  'you are not hosting. you are vibe-casting.',
  'it works on my machine — and now also on theirs.',
  'this is the most production your code will ever feel.',
];

// ---------- config ----------
async function loadConfig() {
  try {
    const cfg = await fetch(`${PREFIX}/config`).then((r) => r.json());
    if (cfg.publicUrl) {
      $('link').textContent = cfg.publicUrl;
      $('link').href = cfg.publicUrl;
      $('qr').src = `${PREFIX}/qr`;
    }
    $('session').textContent = cfg.sessionName || '…';
    $('provider').textContent = cfg.provider || '…';
    $('mode').textContent = cfg.proxy ? 'live visitor feed on' : 'direct tunnel';
    document.title = `✨ ${cfg.sessionName || 'LocalhostVibe'} · control room`;
  } catch {
    /* not ready yet; SSE 'session' event will fill it in */
  }
}

// ---------- stats ----------
function setNum(id, value) {
  const el = $(id);
  if (el.textContent !== String(value)) {
    el.textContent = value;
    el.classList.remove('bump');
    void el.offsetWidth; // restart animation
    el.classList.add('bump');
  }
}

async function loadStats() {
  try {
    const s = await fetch(`${PREFIX}/stats`).then((r) => r.json());
    startedAt = s.startedAt || startedAt;
    setNum('vibe', s.vibeScore);
    setNum('visits', s.visits);
    setNum('friends', s.friends);
    if (s.recent?.length) {
      $('feed').innerHTML = '';
      [...s.recent].reverse().forEach(addFeed);
    }
  } catch {}
}

function fmtUptime(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}
setInterval(() => ($('uptime').textContent = fmtUptime(Date.now() - startedAt)), 1000);

// ---------- live feed ----------
function shortUA(ua = '') {
  if (/iphone|android|mobile/i.test(ua)) return '📱';
  if (/curl|wget|httpie/i.test(ua)) return '🤖';
  if (/bot|spider|crawl/i.test(ua)) return '🕷️';
  return '💻';
}

function addFeed(event) {
  const feed = $('feed');
  const empty = feed.querySelector('.empty');
  if (empty) empty.remove();

  const li = document.createElement('li');
  const time = new Date(event.at || Date.now()).toLocaleTimeString();

  if (event.type === 'milestone') {
    li.className = 'milestone';
    li.innerHTML = `<span>★</span><span>${event.message}</span><span class="time">${time}</span>`;
  } else if (event.type === 'visit') {
    const badge = event.newFriend ? `<span class="badge">new friend</span>` : '';
    li.innerHTML = `<span>${shortUA(event.ua)}</span><span>a friend opened <b>${escapeHtml(
      event.path || '/',
    )}</b></span>${badge}<span class="time">${time}</span>`;
  } else if (event.type === 'connect') {
    li.innerHTML = `<span>🔗</span><span>edge connection${
      event.location ? ` · ${escapeHtml(event.location)}` : ''
    }</span><span class="time">${time}</span>`;
  } else {
    return;
  }

  feed.prepend(li);
  while (feed.children.length > 60) feed.lastChild.remove();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- SSE ----------
function connect() {
  const es = new EventSource(`${PREFIX}/events`);
  es.onopen = () => {
    $('dot').classList.add('live');
    $('status-text').textContent = 'live';
  };
  es.onerror = () => {
    $('dot').classList.remove('live');
    $('status-text').textContent = 'reconnecting…';
  };
  es.onmessage = (e) => {
    let event;
    try {
      event = JSON.parse(e.data);
    } catch {
      return;
    }
    if (event.type === 'session') {
      loadConfig();
      return;
    }
    if (event.type === 'hello') return;
    if (typeof event.vibeScore === 'number') setNum('vibe', event.vibeScore);
    if (typeof event.visits === 'number') setNum('visits', event.visits);
    if (typeof event.friends === 'number') setNum('friends', event.friends);
    addFeed(event);
    if (event.type === 'milestone') burstConfetti();
  };
}

// ---------- buttons ----------
$('copy').addEventListener('click', async () => {
  const url = $('link').textContent;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const t = document.createElement('textarea');
    t.value = url;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  const btn = $('copy');
  btn.classList.add('copied');
  btn.textContent = '✓ copied! now go share it';
  burstConfetti();
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.textContent = '📋 Copy & share the vibe';
  }, 2200);
});
$('open').addEventListener('click', () => window.open($('link').href, '_blank'));

// ---------- confetti ----------
function burstConfetti(n = 80) {
  const box = $('confetti');
  const colors = ['#e36bf0', '#4be3e3', '#6bf0a8', '#6b8cf0', '#ffd76b'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = colors[i % colors.length];
    s.style.animationDuration = 2 + Math.random() * 2 + 's';
    s.style.animationDelay = Math.random() * 0.4 + 's';
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(s);
    setTimeout(() => s.remove(), 4500);
  }
}

// ---------- easter egg: konami code ----------
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kIdx = 0;
window.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  kIdx = key === KONAMI[kIdx] ? kIdx + 1 : key === KONAMI[0] ? 1 : 0;
  if (kIdx === KONAMI.length) {
    kIdx = 0;
    document.body.style.animation = 'spin 1s ease';
    burstConfetti(200);
    $('vibe-line').textContent = '🕹️ MAXIMUM VIBES UNLOCKED — you found the secret.';
    document.documentElement.style.setProperty('--magenta', '#ffd76b');
  }
});
// tiny spin keyframe injected once
const style = document.createElement('style');
style.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
document.head.appendChild(style);

// easter egg: click the vibe score 7 times
let vibeClicks = 0;
$('vibe').parentElement.addEventListener('click', () => {
  if (++vibeClicks === 7) {
    burstConfetti(120);
    $('vibe-line').textContent = '✨ seven taps. the vibe acknowledges you.';
  }
});

// rotate the footer line every 8s
let lineIdx = 0;
setInterval(() => {
  if ($('vibe-line').textContent.includes('UNLOCKED') || $('vibe-line').textContent.includes('acknowledges')) return;
  lineIdx = (lineIdx + 1) % VIBE_LINES.length;
  $('vibe-line').textContent = VIBE_LINES[lineIdx];
}, 8000);

// ---------- boot ----------
loadConfig();
loadStats();
connect();
console.log('%c✨ LocalhostVibe', 'font-size:20px;font-weight:bold;background:linear-gradient(90deg,#e36bf0,#4be3e3);-webkit-background-clip:text;color:transparent');
console.log('%cyou found the console. respect. try the konami code on the page 🕹️', 'color:#9b96c4');
