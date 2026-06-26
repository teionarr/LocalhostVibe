// Everything that makes the terminal feel like a vibe: banner, colors, spinners,
// QR codes, clipboard, and a respectable number of easter eggs.

import pc from 'picocolors';
import QRCode from 'qrcode';
import { spawn } from 'node:child_process';

const isTTY = process.stdout.isTTY;

// ---------- random vibey session names ----------
const ADJECTIVES = [
  'cosmic', 'velvet', 'lo-fi', 'midnight', 'golden', 'electric', 'dreamy', 'lush',
  'mellow', 'hyper', 'feral', 'serene', 'silken', 'neon', 'glacial', 'sun-drenched',
];
const NOUNS = [
  'latte', 'aura', 'cascade', 'mirage', 'static', 'horizon', 'echo', 'nebula',
  'mango', 'driftwood', 'synth', 'monsoon', 'pixel', 'lagoon', 'comet', 'meadow',
];

// deterministic-ish picker seeded by time without using Math.random gimmicks
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function vibeSessionName() {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(Math.random() * 90 + 10)}`;
}

const VIBES_OF_THE_DAY = [
  'the localhost stays in the room. the link does not.',
  'shipping > localhost. but localhost-with-friends is a close second.',
  'you are not hosting. you are vibe-casting.',
  'somewhere, a sysadmin felt a disturbance.',
  'it works on my machine — and now also on theirs.',
  'this is the most production your code will ever feel.',
];

export function vibeOfTheDay() {
  return pick(VIBES_OF_THE_DAY);
}

// ---------- banner ----------
const ART = String.raw`
  __    ___   ___    __   __   _  _  ___  ___    _   _ ___ ___ ___
 | |   / _ \ / __|  /  \ | |  | || |/ _ \/ __|  | | | |_ _| _ ) __|
 | |__| (_) | (__  | () || |__| __ | (_) \__ \  | |_| || || _ \ _|
 |____|\___/ \___|  \__/ |____|_||_|\___/|___/   \___/|___|___/___|
`;

const PALETTE = [pc.magenta, pc.cyan, pc.blue, pc.magenta, pc.cyan];

export function banner(sessionName) {
  const lines = ART.split('\n');
  const painted = lines
    .map((line, i) => PALETTE[i % PALETTE.length](line))
    .join('\n');
  console.log(painted);
  console.log(
    '   ' +
      pc.dim('share your localhost with friends.  ') +
      pc.italic(pc.dim('yes, really.')),
  );
  if (sessionName) {
    console.log('   ' + pc.dim('session: ') + pc.bold(pc.green(sessionName)));
  }
  console.log();
}

// ---------- spinner ----------
const FRAMES = ['✶', '✸', '✹', '✺', '✹', '✷'];

export function spinner(label) {
  if (!isTTY) {
    console.log(pc.dim('· ') + label + '…');
    return { succeed: (m) => console.log(pc.green('✓ ') + (m || label)), fail: (m) => console.log(pc.red('✗ ') + (m || label)) };
  }
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${pc.magenta(FRAMES[i++ % FRAMES.length])} ${label}…   `);
  }, 90);
  const done = (icon, msg) => {
    clearInterval(id);
    process.stdout.write(`\r${icon} ${msg || label}${' '.repeat(12)}\n`);
  };
  return {
    update: (text) => (label = text),
    succeed: (msg) => done(pc.green('✓'), msg),
    fail: (msg) => done(pc.red('✗'), msg),
  };
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- the public link, big and proud ----------
export async function printLink({ url, provider, localUrl, sessionName, port }) {
  const qr = await QRCode.toString(url, { type: 'terminal', small: true }).catch(() => null);

  console.log();
  console.log(pc.bold(pc.green('  ✦ THE VIBE IS LIVE ✦')));
  console.log();
  console.log('  send your friends this link:');
  console.log('    ' + pc.bold(pc.underline(pc.cyan(url))));
  console.log();
  if (qr) {
    console.log(pc.dim('  …or have them scan this:'));
    console.log(
      qr
        .split('\n')
        .map((l) => '   ' + l)
        .join('\n'),
    );
  }
  const copied = copyToClipboard(url);
  console.log(
    '  ' +
      (copied ? pc.green('📋 link copied to your clipboard') : pc.dim('(clipboard unavailable — copy the link above)')),
  );
  console.log();
  console.log(pc.dim(`  provider: ${provider}   `) + pc.dim(`your control room: ${localUrl}`));
  if (port === 1337) console.log(pc.magenta('  🕶️  port 1337 — elite vibes detected'));
  if (port === 8080) console.log(pc.dim('  (8080: the people\'s port)'));
  console.log(pc.dim('  ' + vibeOfTheDay()));
  console.log();
  console.log(pc.dim('  watch friends connect in your control room. press ') + pc.bold('Ctrl+C') + pc.dim(' to end the vibe.'));
  console.log();
}

// ---------- clipboard (best-effort, no extra deps) ----------
export function copyToClipboard(text) {
  const cmd =
    process.platform === 'darwin'
      ? 'pbcopy'
      : process.platform === 'win32'
        ? 'clip'
        : 'xclip -selection clipboard';
  try {
    const p = spawn(cmd, { shell: true, stdio: ['pipe', 'ignore', 'ignore'] });
    p.on('error', () => {});
    p.stdin.on('error', () => {});
    p.stdin.write(text);
    p.stdin.end();
    return true;
  } catch {
    return false;
  }
}

// ---------- live visitor pings (printed in the terminal as friends arrive) ----------
export function visitorPing(event) {
  if (event.type === 'milestone') {
    console.log(pc.bold(pc.magenta('  ★ ' + event.message)));
    return;
  }
  if (event.type === 'visit') {
    const who = event.newFriend ? pc.green('a new friend') : pc.dim('a friend');
    console.log(
      pc.dim('  → ') +
        who +
        pc.dim(` opened `) +
        pc.cyan(event.path || '/') +
        pc.dim(`  · vibe score ${pc.bold(event.vibeScore)}`),
    );
  }
}

// ---------- the long goodbye ----------
export function goodbye(stats) {
  const mins = Math.max(1, Math.round((stats.uptimeMs || 0) / 60000));
  console.log();
  console.log(pc.magenta('  🌙 the vibe has ended.'));
  console.log(
    pc.dim(
      `  ${stats.visits} visit${stats.visits === 1 ? '' : 's'} · ` +
        `${stats.friends} friend${stats.friends === 1 ? '' : 's'} · ` +
        `final vibe score ${stats.vibeScore} · ` +
        `${mins} min of glory`,
    ),
  );
  if (stats.visits === 0) {
    console.log(pc.dim('  (nobody came. the vibe was for you all along. 💜)'));
  }
  console.log();
}
