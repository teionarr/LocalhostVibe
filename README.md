# localhostvibe 🌐✨

### Introducing `localhostvibe`.

There is a grief no one names: you ship a thing. You paste the link. *"hmm, blank page for me?"*

`localhost:3000` is flawless. Luminous. A masterpiece — for an audience of exactly one. Everyone else gets a spinner that resolves to nothing, because to them your creation is a rumor.

I encountered the problem at 3:47 AM, somewhere between my fourth coffee and a business plan to replace the calendar. I told myself it was a skill issue. It was, in fact, an injustice.

Market research: a poll in a group chat (three responses, one was an emoji). Total addressable market: every person who has ever typed `npm run dev` and then felt lonely. Acquisition cost: zero, because the product spreads through *shame*.

Funding round: I pitched my cat. He blinked slowly, which my advisors interpreted as a term sheet. Valuation: undisclosed, but spiritually enormous. The cat has since recused himself over a conflict of interest (he is also an angel in a competing nap startup).

After a focused 9-minute build and a brief argument with my own reflection:

```bash
npm install -g localhostvibe     # then: vibe share 3000
npx localhostvibe share 3000     # zero-install, maximum nerve
```

One command. Your `localhost` is now visible to your friends, your group chat, your ex, and at least one stranger who will say *"clean UI"* and vanish.

We are not "a tunnel." A tunnel is a hole. We are a **handshake at planetary scale** — every shared link a small, trembling act of faith between two browsers who have never met. We do not move packets. We move *belief*.

Fully open source, because connectivity is a human right. (The vision, however, remains proprietary.)

**`localhostvibe`. Stop describing your app. Start showing it.**

---

## Install

```bash
npm install -g localhostvibe     # global: the word "vibe" now lives in your shell
npx localhostvibe share 3000     # or run it once and commit to nothing
```

<sub>Source build: `npm install -g github:teionarr/LocalhostVibe`</sub>

## Use it

Run your app like you always do. Then point us at its port:

```bash
vibe share 3000
```

You get back:

- 🔗 a **real public link**, copied to your clipboard before you can second-guess it
- 📱 a **QR code** in your terminal, for friends in the same room who refuse to type
- 🛰️ a **control room** that opens in your browser — a live dashboard of everyone connecting right now, plus a **vibe score** computed by methods we are legally advised not to disclose

Hit <kbd>Ctrl+C</kbd> to end it. All vibes are temporary. That's what makes them vibes.

## The technology, briefly

Fine. Between us, off the record, no slides: it's a tunnel. A real one. Traffic leaves through Cloudflare (default) or localtunnel, reaches your person, and returns — counted, witnessed, alive.

```
your friend ──▶ the public link ──▶ control room (counts the visit) ──▶ your localhost:3000
```

Which is *why* the visitor feed isn't a vanity stat. It's a human, at a keyboard, looking at the thing you made. The dashboard simply tells you the truth in real time.

## Keep "localhost" in the link

Some of us refuse to grow. Beautiful. Same.

```bash
vibe share 3000 --localhost      # → https://localhost-orbit.loca.lt
```

A link whose hostname is *literally* `localhost` cannot exist — it would point at your friend's own machine, and your friend's machine has not earned this. So we smuggle the word into a genuine public subdomain instead. It's the principle of the thing.

## Options

```
vibe share <port> [options]

--localhost          keep the word "localhost" in the public link
--subdomain <name>   name it yourself (uses localtunnel)
--provider <name>    cloudflare (default) | localtunnel
--no-proxy           tunnel straight to your app (turns off the live feed)
--no-open            don't auto-open the control room
--prefix <path>      control-room path (default /_vibe)
-h, --help
-v, --version
```

## Easter eggs

There are a few, seeded throughout like little acts of love. The Konami code is listening. The browser console has opinions. Port `1337` knows what it did. We won't say more — a roadmap kills the magic, and we are nothing if not magic.

## Enterprise

`localhostvibe` Enterprise adds SSO, audit logs, a 99.99% SLA, and a dedicated success manager whose entire role is to forward your emails to a second, more senior success manager. Pricing on request. The request is, itself, the product.

## A word on safety (we contain multitudes, also good sense)

While the tunnel is live, anyone holding the link can reach your app. Don't expose secrets, don't share anything you wouldn't want a stranger to screenshot, and <kbd>Ctrl+C</kbd> the moment the demo is over. The vibe should end on *your* terms.

## License

MIT. Built for the bit. `localhost` was never meant to be lonely.

**`localhostvibe`. Be seen.** ✨
