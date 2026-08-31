import { mkdirSync } from "node:fs";
import path from "node:path";
import { Solari, SolariError } from "@solarisdk/browser";
import { DEFAULT_SOURCES, dryFindings } from "../sources.js";
import type { ReconFindings, SourceFinding } from "../types.js";
import * as ui from "../ui.js";

/** How much visible text to capture per page. */
const EXCERPT_CHARS = 2400;

/**
 * PHASE 1 — RECON. A stealth Solari cloud browser with residential proxy
 * egress visits every source, reads it, and screenshots it. The screenshots
 * land in artifacts/, the structured findings go to the sandbox in phase 2.
 */
export async function runRecon(opts: {
  goal: string;
  dry: boolean;
  artifactsDir: string;
}): Promise<ReconFindings> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  mkdirSync(opts.artifactsDir, { recursive: true });

  if (opts.dry) {
    ui.info("dry-run: simulating the browser swarm (no microVMs will be billed)");
    await ui.sleep(600);
    const sources = dryFindings(opts.goal, startedAt);
    for (const s of sources) ui.ok(`${s.label} — ${s.bytes.toLocaleString()} chars (simulated)`);
    ui.ok(`egress: proxy-egress-confirmed ${ui.dim("(simulated)")}`);
    return {
      goal: opts.goal,
      mode: "dry-run",
      startedAt,
      finishedAt: new Date().toISOString(),
      egress: "proxy-egress-confirmed (simulated)",
      sources,
    };
  }

  const solari = new Solari({ apiKey: process.env.SOLARI_API_KEY! });

  // Try the full setup first: stealth + residential proxy + session recording.
  // Free plans return FeatureRequiresPlan — degrade to a standard session
  // instead of dying, because the pipeline works with or without the bells.
  let browser: Awaited<ReturnType<Solari["launch"]>>;
  try {
    browser = await solari.launch({
      // stealth: fingerprint patches + a headful browser on a real GPU.
      // proxy: residential egress — required for anything that blocks bots.
      // recording: per-session rrweb replay, downloadable after release.
      stealth: true,
      proxy: "us",
      recording: true,
    });
    ui.ok(`browser session ${ui.bold(browser.id)} up ${ui.dim(`(${browser.version()})`)}`);
    if (browser.proxy) {
      ui.ok(`proxy resolved: ${browser.proxy.country} / ${browser.proxy.tier} / ${browser.proxy.timezoneId}`);
    }
  } catch (err) {
    if (err instanceof SolariError && err.code === "FeatureRequiresPlan") {
      ui.warn(`plan doesn't include stealth/proxy/recording (${err.message.slice(0, 90)})`);
      ui.info("degrading to a standard cloud browser session — the reading still happens");
      browser = await solari.launch();
      ui.ok(`browser session ${ui.bold(browser.id)} up ${ui.dim(`(${browser.version()}, standard)`)}`);
    } else {
      throw err;
    }
  }

  const sources: SourceFinding[] = [];
  try {
    const page = await browser.newPage();
    for (const src of DEFAULT_SOURCES) {
      const tSrc = Date.now();
      const shotPath = path.join(opts.artifactsDir, `recon-${slug(src.label)}.png`);
      try {
        await page.goto(src.url, { waitUntil: "domcontentloaded", timeout: 25_000 });
        const title = (await page.title()).trim();
        const heading = await page
          .locator("h1")
          .first()
          .innerText({ timeout: 5_000 })
          .catch(() => "");
        const text = await page.evaluate(() => document.body?.innerText ?? "");
        await page.screenshot({ path: shotPath }).catch(() => {});
        const finding: SourceFinding = {
          url: src.url,
          label: src.label,
          title,
          heading,
          status: "ok",
          bytes: text.length,
          excerpt: text.slice(0, EXCERPT_CHARS),
          screenshot: path.basename(shotPath),
          elapsedMs: Date.now() - tSrc,
        };
        sources.push(finding);
        ui.ok(`${src.label} — ${finding.bytes.toLocaleString()} chars in ${ui.fmtMs(finding.elapsedMs)}`);
      } catch (err) {
        const finding: SourceFinding = {
          url: src.url,
          label: src.label,
          title: "",
          heading: "",
          status: "failed",
          error: err instanceof Error ? err.message.slice(0, 120) : String(err),
          bytes: 0,
          excerpt: "",
          elapsedMs: Date.now() - tSrc,
        };
        sources.push(finding);
        ui.fail(`${src.label} — ${finding.error}`);
      }
    }
  } finally {
    // browser.close() RELEASES the session (required for the recording upload too).
    await browser.close();
    // REQUIRED, or the process hangs forever — the client keeps a loopback
    // proxy open for the connection-retry path. This bites everyone once.
    await solari.close();
  }

  // The egress check is the last source; surface what the sites actually saw.
  const egressSrc = sources.find((s) => s.label.includes("Egress"));
  const egress = egressSrc?.status === "ok" ? egressSrc.excerpt.slice(0, 80) : "unknown";

  return {
    goal: opts.goal,
    mode: "live",
    startedAt,
    finishedAt: new Date().toISOString(),
    egress,
    sources,
  };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
