# LocalhostVibe 🌐✨

### Introducing LocalhostVibe. Now your friends can see localhost.

For years, a quiet tragedy: you build something. You send the link. *"it's not loading for me?"*

`localhost:3000` works perfectly. On your machine. To everyone else, it does not exist.

I discovered this problem at 1:14 AM. I assumed it was a me problem. It was a market problem.

I did customer discovery (asked four people in a Discord). I sized the TAM (millions of vibecoders, each with at least one friend). I raised a pre-seed: one tuna sandwich, from my wife.

Today, after tireless engineering:

```bash
npx localhostvibe share 3000
```

One command. Your localhost is now visible to your friends, your mom, and the investor who said *"show me when it's live."*

Fully open source. Infrastructure for human connection should belong to everyone.

**LocalhostVibe. Be seen.**

---

## Install

```bash
# global command, available everywhere
npm install -g localhostvibe

# or no-install, maximum spontaneity
npx localhostvibe share 3000
```

Now `vibe` is a real command on your machine. We ship serious software here.

<sub>Prefer the source? `npm install -g github:teionarr/LocalhostVibe` works too.</sub>

## Use it

Start your app however you start your app. Then:

```bash
vibe share 3000
```

You receive:

- 🔗 a **real public link** (auto-copied to your clipboard — we respect your time)
- 📱 a **QR code** in your terminal, for friends who are *physically present*, like animals
- 🛰️ a **control room** that opens in your browser — a live dashboard of every soul who connects, plus a *vibe score*, computed by a proprietary formula we will never explain

Press <kbd>Ctrl+C</kbd> to end the vibe. The vibe always ends. This is the human condition.

## The technology

It's a tunnel.

We considered describing it as "an edge-native, zero-trust visibility fabric for the localhost-curious," and we have that slide if you want it. But between us: it's a tunnel. A real one. Your traffic goes out through Cloudflare (default) or localtunnel, reaches your friend, and comes back, counted and loved.

```
your friend ──▶ the public link ──▶ control room (counts the visit) ──▶ your localhost:3000
```

That's why the visitor feed is *real* — not analytics, not a vanity number. An actual person opened your actual thing, and the dashboard felt it.

## Keeping "localhost" in the link

Some founders cannot let go. We see you. We are you.

```bash
vibe share 3000 --localhost      # → https://localhost-mango.loca.lt
```

A link whose hostname is *literally* `localhost` is, regrettably, impossible — it would resolve to your friend's own machine, and your friend's machine is not the product. So we put the word right in the public address instead. Close enough to feel something.

## Options

```
vibe share <port> [options]

--localhost          keep "localhost" in the link
--subdomain <name>   choose your own destiny (→ localtunnel)
--provider <name>    cloudflare (default) | localtunnel
--no-proxy           tunnel straight to your app (turns off the live feed)
--no-open            don't auto-open the control room
--prefix <path>      control-room path (default /_vibe)
-h, --help
-v, --version
```

## Easter eggs

There are several. The Konami code does something. So does the browser console. So does port `1337`. We hid them because delight cannot be a roadmap item, only a gift. 🕹️

## LocalhostVibe Enterprise

LocalhostVibe Enterprise adds SSO, audit logs, a 99.99% SLA, and a dedicated success manager. Pricing on request. The request is the product.

## A note on security (we are responsible adults)

While the tunnel is open, anyone with the link can reach your app. Don't expose secrets, don't share what you wouldn't show your mom (she's on the link now), and <kbd>Ctrl+C</kbd> when the moment has passed.

## License

MIT. Made for fun. `localhost` was never meant to be lonely.

**LocalhostVibe. Be seen.** ✨
