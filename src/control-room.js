// The Control Room — a tiny Express server that does two jobs:
//
//  1. Reverse-proxies the public tunnel traffic to the user's real app (so every
//     friend who opens the link actually sees the user's localhost), while
//     counting visits — this makes the live visitor feed genuinely real on ANY
//     tunnel provider.
//  2. Serves a local dashboard at <prefix> (default /_vibe) with live stats over SSE.
//
// The tunnel points at THIS server's port. Root path -> user's app. <prefix> -> dashboard.

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import QRCode from 'qrcode';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Milestones are little surprises pushed to the dashboard at certain visit counts.
const MILESTONES = {
  1: '🎉 your first friend just connected!',
  7: '🍀 seven visits — lucky vibes',
  42: '🌌 visit #42 — the answer to localhost, the universe, and everything',
  69: '😎 nice.',
  100: '💯 a CENTURY of vibes',
  404: "🔎 visit #404: this milestone could not be found (but you found it)",
};

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function friendIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'mystery-guest'
  );
}

export async function startControlRoom({ targetPort, prefix = '/_vibe', proxy = true }) {
  const app = express();

  const state = {
    startedAt: Date.now(),
    visits: 0,
    requests: 0,
    friends: new Set(),
    recent: [], // last events, newest first
    session: {}, // filled by setSession()
  };
  const sseClients = new Set();
  const localListeners = new Set(); // in-process subscribers (the terminal)

  function broadcast(event) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of sseClients) res.write(payload);
  }

  function pushEvent(event) {
    const enriched = { ...event, at: Date.now() };
    state.recent.unshift(enriched);
    if (state.recent.length > 50) state.recent.pop();
    broadcast(enriched);
    for (const cb of localListeners) cb(enriched);
  }

  function vibeScore() {
    // immaculate, peer-reviewed formula
    return state.visits * 7 + state.friends.size * 42;
  }

  function recordVisit({ ip, path: reqPath, ua }) {
    state.visits += 1;
    const known = state.friends.has(ip);
    if (ip) state.friends.add(ip);
    pushEvent({
      type: 'visit',
      ip,
      path: reqPath,
      ua,
      newFriend: !known,
      visits: state.visits,
      friends: state.friends.size,
      vibeScore: vibeScore(),
    });
    if (MILESTONES[state.visits]) {
      pushEvent({ type: 'milestone', message: MILESTONES[state.visits], visits: state.visits });
    }
  }

  // ----- Dashboard routes (served under the reserved prefix) -----
  const router = express.Router();

  router.get('/config', (_req, res) => {
    res.json({ ...state.session, prefix });
  });

  router.get('/qr', async (_req, res) => {
    const url = state.session.publicUrl;
    if (!url) return res.status(404).end();
    try {
      const svg = await QRCode.toString(url, { type: 'svg', margin: 1 });
      res.type('image/svg+xml').send(svg);
    } catch {
      res.status(500).end();
    }
  });

  router.get('/stats', (_req, res) => {
    res.json({
      startedAt: state.startedAt,
      uptimeMs: Date.now() - state.startedAt,
      visits: state.visits,
      requests: state.requests,
      friends: state.friends.size,
      vibeScore: vibeScore(),
      recent: state.recent,
    });
  });

  router.get('/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Vibe': 'streaming',
    });
    res.write(`retry: 3000\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'hello', vibeScore: vibeScore() })}\n\n`);
    sseClients.add(res);
    const ping = setInterval(() => res.write(`: keep the vibe alive\n\n`), 15_000);
    req.on('close', () => {
      clearInterval(ping);
      sseClients.delete(res);
    });
  });

  // static dashboard assets (style.css, app.js) + index for the bare prefix
  router.use(express.static(PUBLIC_DIR));
  router.get('/', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

  app.use(prefix, router);

  // ----- Everything else -> the user's real app -----
  if (proxy) {
    // Count html navigations as "visits"; count everything as a request.
    app.use((req, res, next) => {
      if (req.path.startsWith(prefix)) return next();
      state.requests += 1;
      const accept = req.headers.accept || '';
      if (req.method === 'GET' && accept.includes('text/html')) {
        recordVisit({ ip: friendIp(req), path: req.path, ua: req.headers['user-agent'] });
      }
      next();
    });

    app.use(
      createProxyMiddleware({
        target: `http://localhost:${targetPort}`,
        changeOrigin: true,
        ws: true,
        on: {
          proxyRes: (proxyRes) => {
            // a little something for friends who open devtools
            proxyRes.headers['x-powered-by'] = 'pure vibes';
            proxyRes.headers['x-vibe'] = 'immaculate';
          },
          error: (err, _req, res) => {
            if (res.writableEnded) return;
            res.writeHead?.(502, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end?.(
              `<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;background:#0c0a1a;color:#ece9ff;display:grid;place-items:center;height:100vh;margin:0;text-align:center">` +
                `<div><h1>🫠 the vibe is buffering…</h1>` +
                `<p>Couldn't reach your app on port <b>${targetPort}</b>. Is it still running?</p></div>`,
            );
          },
        },
      }),
    );
  }

  const port = await findFreePort();
  const server = await new Promise((resolve) => {
    const s = app.listen(port, () => resolve(s));
  });
  // proxy ws upgrades
  if (proxy) server.on('upgrade', () => {}); // http-proxy-middleware attaches its own handler

  return {
    port,
    prefix,
    localUrl: `http://localhost:${port}${prefix}`,
    setSession(info) {
      state.session = { ...state.session, ...info };
      broadcast({ type: 'session', ...state.session, at: Date.now() });
    },
    // subscribe in-process (used by the terminal to print live pings)
    onEvent(cb) {
      localListeners.add(cb);
    },
    // for --no-proxy mode, the CLI feeds tunnel-level events in here
    recordVisit,
    recordConnect(info) {
      pushEvent({ type: 'connect', ...info });
    },
    snapshot() {
      return {
        visits: state.visits,
        friends: state.friends.size,
        vibeScore: vibeScore(),
        uptimeMs: Date.now() - state.startedAt,
      };
    },
    close() {
      for (const res of sseClients) res.end();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
