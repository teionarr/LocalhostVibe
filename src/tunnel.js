// Tunnel provider abstraction.
// Exposes a uniform shape over two zero-account tunnel providers so the rest of
// the app never cares which one is running:
//
//   const t = await startTunnel({ port, provider, onStatus });
//   t.url           -> public https URL friends can open
//   t.provider      -> 'cloudflare' | 'localtunnel'
//   t.onConnect(cb) -> edge connection established (cloudflare only)
//   t.onRequest(cb) -> an incoming request (localtunnel only; proxy mode counts these itself)
//   t.onClose(cb)   -> tunnel died/closed
//   await t.stop()  -> tear it down
//
// cloudflare  -> *.trycloudflare.com, clean, no interstitial, downloads a ~30MB binary once.
// localtunnel -> *.loca.lt, nothing to download, friends see a one-click "continue" page.

import fs from 'node:fs';

function noopEmitter() {
  const cbs = [];
  return {
    on: (cb) => cbs.push(cb),
    emit: (...args) => cbs.forEach((cb) => cb(...args)),
  };
}

async function startCloudflare({ port, onStatus }) {
  const { Tunnel, bin, install } = await import('cloudflared');

  if (!fs.existsSync(bin)) {
    onStatus?.('downloading the tunnel engine (one-time, ~30MB)…');
    await install(bin);
  }

  const tunnel = Tunnel.quick(`http://localhost:${port}`);
  const connect = noopEmitter();
  const request = noopEmitter();
  const close = noopEmitter();

  tunnel.on('connected', (conn) => connect.emit(conn));
  tunnel.on('exit', (code) => close.emit(code));
  tunnel.on('error', (err) => close.emit(err));

  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('cloudflare tunnel timed out (no URL after 30s)')),
      30_000,
    );
    tunnel.once('url', (u) => {
      clearTimeout(timeout);
      resolve(u);
    });
    tunnel.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  return {
    url,
    provider: 'cloudflare',
    onConnect: connect.on,
    onRequest: request.on, // cloudflare quick tunnels don't surface per-request events
    onClose: close.on,
    stop: async () => {
      tunnel.stop();
    },
  };
}

async function startLocaltunnel({ port, subdomain }) {
  const localtunnel = (await import('localtunnel')).default;
  const opts = { port };
  if (subdomain) opts.subdomain = subdomain;
  const tunnel = await localtunnel(opts);

  const connect = noopEmitter();
  const request = noopEmitter();
  const close = noopEmitter();

  tunnel.on('request', (info) => request.emit(info));
  tunnel.on('close', () => close.emit(0));
  tunnel.on('error', (err) => close.emit(err));

  return {
    url: tunnel.url,
    provider: 'localtunnel',
    onConnect: connect.on, // localtunnel has no edge-connection event
    onRequest: request.on,
    onClose: close.on,
    stop: async () => {
      tunnel.close();
    },
  };
}

export async function startTunnel({ port, provider = 'cloudflare', onStatus, subdomain }) {
  if (provider === 'localtunnel') return startLocaltunnel({ port, onStatus, subdomain });
  if (provider === 'cloudflare') return startCloudflare({ port, onStatus });
  throw new Error(`unknown provider "${provider}" (use "cloudflare" or "localtunnel")`);
}
