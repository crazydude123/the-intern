#!/usr/bin/env node
/**
 * THE INTERN — an autonomous intern built on Solari.
 *
 * You're hiring a $300K intern. This is one instead.
 *
 * One command, three microVMs, one full work cycle:
 *   RECON   stealth cloud browser + residential proxy → reads every source
 *   FORGE   sandbox microVM → renders + publishes the report to a public URL
 *   DELIVER cloud desktop → opens it in real Chrome, screenshots the proof
 *
 *   npx tsx src/index.ts "your goal"          # live (needs SOLARI_API_KEY)
 *   npx tsx src/index.ts --demo --dry-run     # full timeline, zero billing
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { runRecon } from "./phases/recon.js";
import { runForge } from "./phases/forge.js";
import { runDeliver } from "./phases/deliver.js";
import { linkedInPost, xPost } from "./posts.js";
import type { RunResult } from "./types.js";
import * as ui from "./ui.js";

const DEMO_GOAL =
  "Research Solari's cloud browser, sandbox, and desktop stack — then ship a field report proving you did";

function parseArgs(argv: string[]): { goal: string; dry: boolean; post: boolean } {
  const flags = argv.filter((a) => a.startsWith("--"));
  const positional = argv.filter((a) => !a.startsWith("--"));
  return {
    goal: positional.join(" ") || DEMO_GOAL,
    dry: flags.includes("--dry-run"),
    post: flags.includes("--post"),
  };
}

function requireApiKey(dry: boolean): string | undefined {
  const key = process.env.SOLARI_API_KEY;
  if (!key && !dry) {
    ui.fail("SOLARI_API_KEY is not set. Grab one at console.getsolari.com (one key = browsers + sandboxes + desktops).");
    ui.info("or run without spending anything:  the-intern --demo --dry-run");
    process.exit(1);
  }
  return key;
}

async function main(): Promise<void> {
  const { goal, dry, post } = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  console.log(ui.BANNER);
  console.log(`  ${ui.bold("goal")}  ${goal}`);
  console.log(`  ${ui.bold("mode")}  ${dry ? ui.yellow("DRY-RUN (no microVMs, no billing)") : ui.green("LIVE")}\n`);
  requireApiKey(dry);

  const artifactsDir = path.resolve("artifacts");
  mkdirSync(artifactsDir, { recursive: true });

  // ── PHASE 1 · RECON ──────────────────────────────────────────────────────
  ui.phase(1, "RECON", "stealth browser + residential proxy reads every source");
  const tRecon = Date.now();
  const recon = await runRecon({ goal, dry, artifactsDir });
  const reconMs = Date.now() - tRecon;
  ui.phaseEnd();

  // ── PHASE 2 · FORGE ──────────────────────────────────────────────────────
  ui.phase(2, "FORGE", "sandbox microVM renders + publishes the report");
  const tForge = Date.now();
  const forge = await runForge({ findings: recon, dry, artifactsDir });
  const forgeMs = Date.now() - tForge;
  ui.phaseEnd();

  // ── PHASE 3 · DELIVER ────────────────────────────────────────────────────
  ui.phase(3, "DELIVER", "cloud desktop opens the live report and screenshots the proof");
  const tDeliver = Date.now();
  const deliver = await runDeliver({ forge, goal, dry, artifactsDir });
  const deliverMs = Date.now() - tDeliver;
  ui.phaseEnd();

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  const totalMs = Date.now() - t0;
  const run: RunResult = {
    mode: dry ? "dry-run" : "live",
    goal,
    startedAt,
    finishedAt: new Date().toISOString(),
    recon,
    forge,
    deliver,
    timings: { reconMs, forgeMs, deliverMs, totalMs },
  };
  writeFileSync(path.join(artifactsDir, "run.json"), JSON.stringify(run, null, 2), "utf8");

  console.log(`\n${ui.bold("  ══ WORK CYCLE COMPLETE ══")}`);
  ui.kv("report", forge.reportUrl ?? path.relative(process.cwd(), forge.reportPath));
  ui.kv("proof", existsSync(String(deliver.proofPath)) ? String(deliver.proofPath) : `${artifactsDir}/ (see run.json)`);
  ui.kv("watched at", deliver.streamUrl ?? "(dry-run)");
  ui.kv(
    "timings",
    `recon ${ui.fmtMs(reconMs)} · forge ${ui.fmtMs(forgeMs)} · deliver ${ui.fmtMs(deliverMs)} · total ${ui.fmtMs(totalMs)}`,
  );
  ui.kv("artifacts", artifactsDir);
  console.log(
    `\n  ${ui.green("✓")} the intern has finished. A human would now ask for feedback on their probation review.\n`,
  );

  if (post) {
    console.log(ui.bold("  ── X POST ──"));
    console.log(xPost(run));
    console.log(`\n${ui.bold("  ── LINKEDIN POST ──")}`);
    console.log(linkedInPost(run));
    console.log();
  }
}

main().catch((err: unknown) => {
  ui.fail(err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack && process.env.DEBUG) console.log(ui.dim(err.stack));
  process.exit(1);
});
