import type { SourceFinding } from "./types.js";

/**
 * The sources the intern visits during RECON. Swap these for your own goal —
 * this list IS the intern's research plan. The default plan is the meta one:
 * study Solari itself, so the intern can write the report it ships back at
 * the company that assigned the work.
 */
export interface ReconSource {
  url: string;
  label: string;
}

export const DEFAULT_SOURCES: ReconSource[] = [
  { url: "https://github.com/solari-sdk/solari-cookbook", label: "Solari cookbook (GitHub)" },
  { url: "https://docs.getsolari.com", label: "Solari docs" },
  { url: "https://changelog.getsolari.com", label: "Solari changelog" },
  { url: "https://api.ipify.org?format=json", label: "Egress check (ipify)" },
];

/**
 * Dry-run recon data — the exact shape the live browser produces, so the
 * full pipeline (sandbox rendering, report generation, CLI timeline) can be
 * exercised without spending a single microVM-second.
 */
export function dryFindings(goal: string, startedAt: string): SourceFinding[] {
  const base = (over: Partial<SourceFinding> & { url: string; label: string }): SourceFinding => ({
    title: "",
    heading: "",
    status: "ok",
    bytes: 0,
    excerpt: "",
    elapsedMs: 900 + Math.floor(Math.random() * 1400),
    ...over,
  });
  return [
    base({
      url: "https://github.com/solari-sdk/solari-cookbook",
      label: "Solari cookbook (GitHub)",
      title: "solari-cookbook: Short, runnable examples for Solari",
      heading: "Solari Cookbook",
      bytes: 2143,
      elapsedMs: 2311,
      excerpt:
        "Short, runnable examples for Solari — cloud browsers, sandboxes, and desktops behind one API key. " +
        "Cloud browser: you need a web page — scraping, testing, filling forms. Adds stealth, managed proxies, " +
        "captcha solving, profiles, and session recording. Sandbox: you need to run code — a headless microVM " +
        "that boots from a snapshot in about a second. Desktop: you need a screen — computer-use agents, GUI apps, " +
        "anything that has to be clicked. A sandbox plus X11 and a live VNC stream.",
      screenshot: "recon-cookbook.png",
    }),
    base({
      url: "https://docs.getsolari.com",
      label: "Solari docs",
      title: "Solari Docs",
      heading: "One key. Three machines.",
      bytes: 1836,
      elapsedMs: 1502,
      excerpt:
        "Solari exposes cloud browsers, sandboxes, and desktops behind one API key. Browsers are " +
        "Playwright-compatible sessions with stealth mode and residential proxies. Sandboxes are Firecracker-class " +
        "microVMs with a control channel for commands, files, code kernels, git, and port previews. Desktops are " +
        "sandboxes plus X11 and VNC, drivable by mouse, keyboard, and screenshot.",
      screenshot: "recon-docs.png",
    }),
    base({
      url: "https://changelog.getsolari.com",
      label: "Solari changelog",
      title: "Changelog",
      heading: "What's new",
      bytes: 964,
      elapsedMs: 1180,
      excerpt:
        "Recent: session recording is now per-session with rrweb NDJSON replays; sandbox preview URLs serve from "
        + "*.preview.getsolari.com; desktop sessions support pause/resume with full RAM+disk snapshots.",
      screenshot: "recon-changelog.png",
    }),
    base({
      url: "https://api.ipify.org?format=json",
      label: "Egress check (ipify)",
      title: '{"ip":"…"}',
      heading: "",
      bytes: 21,
      elapsedMs: 431,
      excerpt: '{"ip":"proxy-egress-confirmed"}',
      screenshot: "recon-egress.png",
    }),
  ];
}
