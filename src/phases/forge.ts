import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { SolariClient } from "@solarisdk/sdk";
import type { ForgeResult, ReconFindings } from "../types.js";
import * as ui from "../ui.js";

const REPORT_PORT = 8000;
const REPORT_PY = fileURLToPath(new URL("../report.py", import.meta.url));

/**
 * PHASE 2 — FORGE. A Solari sandbox microVM (boots from a snapshot in ~1s)
 * takes the recon JSON, renders a single-file HTML report with pure-stdlib
 * Python, then serves it with `previewUrl()` — a public URL on
 * *.preview.getsolari.com that anyone can open. The report you publish IS the
 * sandbox's output.
 */
export async function runForge(opts: {
  findings: ReconFindings;
  dry: boolean;
  artifactsDir: string;
}): Promise<ForgeResult> {
  const reconJsonPath = path.join(opts.artifactsDir, "recon.json");
  const reportPath = path.join(opts.artifactsDir, "report.html");
  await writeFile(reconJsonPath, JSON.stringify(opts.findings, null, 2), "utf8");

  if (opts.dry) {
    ui.info("dry-run: rendering the report locally with the same script the sandbox runs");
    const proc = spawnSync("python3", [REPORT_PY, reconJsonPath, reportPath], { encoding: "utf8" });
    if (proc.status !== 0) {
      ui.fail(`local render failed: ${proc.stderr}`);
      throw new Error("dry-run report render failed");
    }
    ui.ok(`rendered ${ui.bold(path.basename(reportPath))} — ${proc.stdout.trim()}`);
    ui.warn("dry-run: no gateway, so no public URL. Set SOLARI_API_KEY for the real thing.");
    return {
      sandboxId: "dry-run-local",
      reportUrl: null,
      reportPath,
      reportBytes: (await readFile(reportPath)).byteLength,
    };
  }

  const pt = new SolariClient({ apiKey: process.env.SOLARI_API_KEY! });
  const sandbox = await pt.sandboxes.create({
    template: "base",
    // Rolling IDLE window — resets on every use, NOT a hard deadline.
    timeoutMs: 15 * 60_000,
  });
  ui.ok(`sandbox ${ui.bold(sandbox.sandboxId)} created`);
  const t0 = Date.now();

  try {
    await sandbox.connect();
    ui.ok(`control channel open ${ui.dim(`(${ui.fmtMs(Date.now() - t0)} after create)`)}`);

    // Hand the intern its own recon notes and its pen.
    await sandbox.files.write("/tmp/intern/recon.json", JSON.stringify(opts.findings, null, 2));
    await sandbox.files.write("/tmp/intern/report.py", await readFile(REPORT_PY, "utf8"));
    ui.ok("uploaded recon.json + report.py to the VM");

    // `cmd` is NOT shell-interpreted — argv goes in `args`.
    const out = await sandbox.commands.run("python3", {
      args: ["/tmp/intern/report.py", "/tmp/intern/recon.json", "/tmp/intern/report.html"],
      timeoutMs: 60_000,
    });
    if (out.exitCode !== 0) throw new Error(`report render failed: ${out.stderr}`);
    ui.ok(`rendered in-guest — ${out.stdout.trim()}`);

    // Pull the report back so the repo keeps a copy, then serve it from the VM.
    const html = await sandbox.files.download("/tmp/intern/report.html");
    await writeFile(reportPath, html, "utf8");

    // commands.run waits for exit, so background the server through a shell.
    await sandbox.commands.run("sh", {
      args: ["-c", `cd /tmp/intern && nohup python3 -m http.server ${REPORT_PORT} >/dev/null 2>&1 &`],
    });
    const { url } = await sandbox.previewUrl(REPORT_PORT);
    ui.ok(`serving on port ${REPORT_PORT} → public preview URL`);

    return {
      sandboxId: sandbox.sandboxId,
      reportUrl: url,
      reportPath,
      reportBytes: html.byteLength,
    };
  } finally {
    // kill(), not close(): close() only drops the local control channel and
    // the VM would linger until its idle timeout. Kill is what we mean.
    await sandbox.kill();
    ui.ok("sandbox destroyed");
  }
}
