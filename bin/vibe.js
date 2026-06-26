#!/usr/bin/env node
// LocalhostVibe — the utility that makes "just send me the localhost link" finally real.
import { run } from '../src/cli.js';

run(process.argv.slice(2)).catch((err) => {
  console.error('\n💥 the vibe collapsed:', err?.message || err);
  process.exit(1);
});
