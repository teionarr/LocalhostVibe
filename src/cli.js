// LocalhostVibe CLI — parse args, run the show, end it gracefully.

import { parseArgs } from 'node:util';
import net from 'node:net';
import open from 'open';
import pc from 'picocolors';
import { startControlRoom } from './control-room.js';
import { startTunnel } from './tunnel.js';
import {
  banner,
  spinner,
  sleep,
  printLink,
  visitorPing,
  goodbye,
  vibeSessionName,
  vibeOfTheDay,
} from './vibe.js';

const VERSION = '1.0.0';

const HELP = `
${pc.bold('LocalhostVibe')} 🌐✨  — share your localhost with friends

${pc.bold('Usage')}
  vibe share <port> [options]
  vibe <port>                  ${pc.dim('(shorthand)')}

${pc.bold('Options')}
  --localhost         ${pc.dim('keep "localhost" in the link, e.g. https://localhost-mango.loca.lt')}
  --subdomain <name>  ${pc.dim('pick your own subdomain (implies --provider localtunnel)')}
  --provider <name>   ${pc.dim('cloudflare (default) | localtunnel')}
  --no-proxy          ${pc.dim('tunnel straight to your app (disables the live visitor feed)')}
  --no-open           ${pc.dim("don't auto-open the control room in your browser")}
  --prefix <path>     ${pc.dim('control-room path in proxy mode (default /_vibe)')}
  -h, --help          ${pc.dim('show this')}
  -v, --version       ${pc.dim('show version')}

${pc.bold('Examples')}
  vibe share 3000
  vibe share 3000 --localhost        ${pc.dim('→ https://localhost-….loca.lt')}
  vibe 5173 --subdomain my-cool-app
  vibe share 8080 --no-proxy

${pc.dim(vibeOfTheDay())}
`;

function checkLocalPort(port) {
  // returns true if something is already listening locally (i.e. the user's app is up)
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    const finish = (up) => {
      sock.destroy();
      resolve(up);
    };
    sock.setTimeout(1000);
    sock.once('connect', () => finish(true));
    sock.once('timeout', () => finish(false));
    sock.once('error', () => finish(false));
  });
}

export async function run(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      provider: { type: 'string' },
      subdomain: { type: 'string' },
      localhost: { type: 'boolean', default: false },
      prefix: { type: 'string', default: '/_vibe' },
      'no-proxy': { type: 'boolean', default: false },
      'no-open': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
  });

  if (values.version) return void console.log(`localhost-vibe v${VERSION}`);
  if (values.help) return void console.log(HELP);

  // command + port resolution: "share <port>", "<port>", or easter-egg words
  let words = [...positionals];
  if (words[0] === 'share') words.shift();

  // easter egg: `vibe fortune` / `vibe horoscope`
  if (['fortune', 'horoscope', 'vibe'].includes(words[0])) {
    console.log('\n  🔮 ' + pc.magenta(vibeOfTheDay()) + '\n');
    return;
  }

  const port = Number(words[0]);
  if (!words.length || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.log(HELP);
    if (words.length) console.error(pc.red(`\n  "${words[0]}" is not a valid port.`));
    process.exitCode = words.length ? 1 : 0;
    return;
  }

  let provider = values.provider || 'cloudflare';
  if (!['cloudflare', 'localtunnel'].includes(provider)) {
    console.error(pc.red(`  unknown provider "${provider}" — try cloudflare or localtunnel`));
    process.exitCode = 1;
    return;
  }
  const proxy = !values['no-proxy'];
  const prefix = values.prefix.startsWith('/') ? values.prefix : `/${values.prefix}`;
  const sessionName = vibeSessionName();

  // keep "localhost" in the public link — only localtunnel supports custom subdomains.
  // (a link whose host is *literally* localhost is impossible: it would point at the
  //  friend's own machine. the closest we can do is localhost-<word>.loca.lt)
  let subdomain = values.subdomain;
  if (values.localhost && !subdomain) subdomain = `localhost-${sessionName.split('-')[1]}`;
  if (subdomain) subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');

  banner(sessionName);

  if (subdomain && provider === 'cloudflare') {
    if (values.provider === 'cloudflare') {
      console.log(
        pc.dim(`  note: cloudflare can't do custom names — switching to localtunnel for "${subdomain}".\n`),
      );
    }
    provider = 'localtunnel';
  }

  // 1. vibe check
  let s = spinner('checking the vibes');
  await sleep(450);
  const appUp = await checkLocalPort(port);
  if (appUp) s.succeed(`vibes checked — something is alive on port ${port}`);
  else s.fail(`nothing seems to be running on port ${port} yet`);
  if (!appUp) {
    console.log(
      pc.dim(`  heads up: start your app on port ${port} or friends will see an empty room.\n`),
    );
  }

  // 2. control room
  s = spinner('summoning the control room');
  const room = await startControlRoom({ targetPort: port, prefix, proxy });
  s.succeed('control room is up');

  // 3. the tunnel (may download the cloudflared binary the first time)
  s = spinner('opening a tunnel to the outside world');
  let tunnel;
  try {
    tunnel = await startTunnel({
      port: proxy ? room.port : port,
      provider,
      subdomain,
      onStatus: (msg) => s.update(msg),
    });
  } catch (err) {
    s.fail('the tunnel refused to open');
    await room.close();
    throw err;
  }
  s.succeed(`tunnel open via ${tunnel.provider}`);
  if (subdomain && !tunnel.url.includes(subdomain)) {
    console.log(pc.dim(`  ("${subdomain}" was taken — loca.lt handed you the link below instead)`));
  }

  // 4. theatrics
  s = spinner('un-localhosting your localhost');
  await sleep(600);
  s.succeed('localhost successfully un-localhosted');

  // tell the dashboard who/what we are
  room.setSession({
    publicUrl: tunnel.url,
    provider: tunnel.provider,
    sessionName,
    targetPort: port,
    proxy,
    localUrl: room.localUrl,
  });

  // live wiring
  room.onEvent((event) => visitorPing(event));
  tunnel.onConnect((conn) =>
    room.recordConnect({ location: conn?.location, ip: conn?.ip, id: conn?.id }),
  );
  if (!proxy) {
    // without the proxy we lean on provider-level request events (localtunnel only)
    tunnel.onRequest((info) =>
      room.recordVisit({ ip: 'visitor', path: info?.path || '/', ua: info?.method }),
    );
  }
  tunnel.onClose(() => {});

  // 5. show the link + QR + copy
  await printLink({
    url: tunnel.url,
    provider: tunnel.provider,
    localUrl: room.localUrl,
    sessionName,
    port,
  });

  // 6. open the control room
  if (!values['no-open']) {
    open(room.localUrl).catch(() => {});
  }

  // 7. keep the vibe alive until Ctrl+C
  let ending = false;
  const end = async () => {
    if (ending) return;
    ending = true;
    try {
      await tunnel.stop();
    } catch {}
    const stats = room.snapshot();
    await room.close();
    goodbye(stats);
    process.exit(0);
  };
  process.on('SIGINT', end);
  process.on('SIGTERM', end);

  // park forever
  await new Promise(() => {});
}
