<div align="center">

# 🧢 THE INTERN

**You're hiring a $300K intern. This is one instead.**

*An autonomous agent built on [Solari](https://getsolari.com) — cloud browsers, sandboxes, and desktops, one API key, one full work cycle.*

`npm run demo:dry` works with **zero billing**. One key makes it real.

</div>

---

## The application

Pinetree Research said: *"build a real use case with Solari."*

THE INTERN is a real use case **and** the applicant. It's a CLI that runs a complete work cycle on Solari's own infrastructure:

| Phase | Machine | What happens |
|---|---|---|
| **01 · RECON** | ☁️ Cloud **browser** (`@solarisdk/browser`) | Stealth session + residential proxy egress + session recording. Visits every source, reads the page text, screenshots it. |
| **02 · FORGE** | 📦 **Sandbox** (`@solarisdk/sdk`) | A microVM that boots from a snapshot in ~1s. Gets the recon JSON, renders a full HTML report (pure-stdlib Python, inline SVG charts), and publishes it with `previewUrl()` → **public URL** on `*.preview.getsolari.com`. |
| **03 · DELIVER** | 🖥️ **Desktop** (`@solarisdk/desktop`) | A GUI VM with X11 + VNC. Opens the live report in real Chrome, takes a proof screenshot. Print the `streamUrl` and you can **watch it work live** in any VNC viewer. |

The deliverable isn't a screenshot of code. It's a **live report URL** your interviewer can open, produced by three microVMs, with proof-of-delivery from a fourth screen.

## Quickstart

```bash
git clone https://github.com/YOUR_HANDLE/the-intern.git
cd the-intern
npm install

# 1) See the full pipeline with no API key and no billing:
npm run demo:dry

# 2) Make it real:
cp .env.example .env   # paste your slr_live_ key from console.getsolari.com
npm run demo           # the intern researches Solari and ships a field report

# 3) Any goal works:
npm run intern -- "profile the top 5 competitors in <your market> and publish a briefing"
npm run intern -- --post   # generate the announcement post from the last run
```

**What you get on every live run** (in `artifacts/`):

- `recon.json` — structured findings from every source
- `recon-*.png` — screenshots of each page the browser read
- `report.html` — the report, exactly as the sandbox rendered it
- `deliver-proof.png` — the desktop's screenshot of the live report in Chrome
- `run.json` — the full transcript: sessions, timings, egress, everything

## How it works

```
                      ┌─────────────────────────────────────────────┐
                      │            SOLARI_API_KEY (one key)         │
                      └─────────────────────────────────────────────┘
        ┌──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼
  ┌───────────┐         ┌───────────┐         ┌───────────┐
  │  BROWSER  │  recon  │  SANDBOX  │  forge  │  DESKTOP  │
  │ stealth + │────────▶│ microVM   │────────▶│ X11 + VNC │
  │ proxy +   │ JSON    │ python +  │ URL     │ chrome +  │
  │ recording │ + PNGs  │ http.server│ + proof │ screenshot│
  └───────────┘         └───────────┘         └───────────┘

## The Solari gotchas this repo already paid for

Straight from the [cookbook](https://github.com/solari-sdk/solari-cookbook), encoded where they bite:

- **`await solari.close()` after every browser run** — skip it and the process hangs forever (the client keeps a loopback proxy open for retries). See `src/phases/recon.ts`.
- **`browser.close()` releases the session** — closing anything less holds the slot until the plan deadline.
- **`sandbox.kill()`, not `close()`** — `close()` only drops the local control channel; the VM lingers until idle timeout. See `src/phases/forge.ts`.
- **`commands.run("ls -la")` looks for a binary named `ls -la`** — argv goes in `args`, and background servers go through `run("sh", { args: ["-c", "... &"] })`. See the http.server line.
- **`previewUrl()` is the whole publishing trick** — an in-guest port becomes a public `https://` URL. That's how a sandbox becomes a web host.
- **Desktops need a health wait** — poll `desktop.health()` until ready before clicking, or your keystrokes go nowhere. See `src/phases/deliver.ts`.
- **`timeoutMs` is a rolling idle window**, not a deadline. It resets on every use.

## Project layout

```
src/
├── index.ts            CLI + orchestrator (the boss)
├── phases/
│   ├── recon.ts        Phase 1 · @solarisdk/browser  (stealth + proxy + recording)
│   ├── forge.ts        Phase 2 · @solarisdk/sdk      (sandbox + previewUrl)
│   └── deliver.ts      Phase 3 · @solarisdk/desktop  (GUI + screenshot proof)
├── report.py           the intern's pen — pure-stdlib report renderer (runs IN the sandbox)
├── sources.ts          the research plan — swap these URLs for any goal
├── posts.ts            generates the announcement post from a real run
└── types.ts / ui.ts    shared types + zero-dep terminal UI
```

## Cost & footprint

A default demo run: 1 browser session (~1 min), 1 sandbox (~30s), 1 desktop (~30s). `--dry-run` exercises the identical timeline, renders the same report, and writes the same `artifacts/` — for free.

## The meta part

The default demo goal is *"research Solari's stack, then ship a field report proving you did."* The agent studies the company's product with the company's product, publishes the findings on the company's infrastructure, and screenshots the result from the company's own desktop. This repo **is** the cover letter.

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
<sub>built by a human directing AI, running on machines that have never once asked for a performance review</sub>
</div>

```

The brain is deliberately boring: a typed 3-phase orchestrator (~500 lines, zero AI-API deps) that anyone can extend. Swap `DEFAULT_SOURCES` in `src/sources.ts` and the same pipeline works for market research, due diligence, competitive briefings, link-checking a course syllabus — anything that's *"read the web, compute, publish, prove it."*
