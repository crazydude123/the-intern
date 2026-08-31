import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DesktopClient, type Desktop } from "@solarisdk/desktop";
import type { DeliverResult, ForgeResult } from "../types.js";
import * as ui from "../ui.js";

/**
 * PHASE 3 — DELIVER. A Solari desktop (a sandbox plus X11 and a live VNC
 * stream) opens the published report in a real Chrome on a real screen and
 * screenshots it as proof. The `streamUrl` lets a human watch the intern
 * work live in any VNC viewer — great for demos, unsettling for the intern.
 */
export async function runDeliver(opts: {
  forge: ForgeResult;
  goal: string;
  dry: boolean;
  artifactsDir: string;
}): Promise<DeliverResult> {
  const proofPath = path.join(opts.artifactsDir, "deliver-proof.png");
  const reportUrl = opts.forge.reportUrl;

  if (opts.dry) {
    ui.info("dry-run: simulating the desktop delivery");
    await ui.sleep(500);
    ui.ok(`opened ${ui.bold("chrome")} on the report (simulated)`);
    ui.ok("screenshot taken (simulated)");
    return { sessionId: "dry-run-desktop", app: "chrome (simulated)" };
  }

  if (!reportUrl) throw new Error("no report URL from phase 2 — cannot deliver");

  const client = new DesktopClient({
    apiKey: process.env.SOLARI_API_KEY!,
    baseUrl: process.env.SOLARI_BASE_URL ?? "https://api.getsolari.com",
  });
  const desktop: Desktop = await client.create({
    template: "default",
    resolution: "1280x720",
    record: true,
    // Rolling idle window; auto-pauses after, resets on every action.
    timeoutMs: 10 * 60_000,
  });
  ui.ok(`desktop session ${ui.bold(desktop.sessionId)} created`);
  ui.info(`watch live: ${ui.cyan(desktop.streamUrl)}`);

  try {
    await desktop.connect();

    // Wait for X11 + VNC + the agent to be up before driving the GUI.
    const t0 = Date.now();
    for (let i = 0; i < 30; i++) {
      const health = await desktop.health();
      if ((health as { ready?: boolean }).ready) break;
      await ui.sleep(1_000);
    }
    ui.ok(`GUI ready ${ui.dim(`(${ui.fmtMs(Date.now() - t0)})`)}`);

    // Open the report in Chrome. Different images name the binary
    // differently; `open()` fails cleanly if it's not in the image, so try
    // the common names before falling back to xdg-open.
    const candidates: Array<[string, string[]]> = [
      ["google-chrome", [reportUrl]],
      ["chrome", [reportUrl]],
      ["chromium", [reportUrl]],
    ];
    let app: string | undefined;
    for (const [name, args] of candidates) {
      try {
        await desktop.open(name, args);
        app = name;
        ui.ok(`opened ${ui.bold(name)} on the report`);
        break;
      } catch {
        ui.info(`${name} not in image, trying next…`);
      }
    }
    if (!app) {
      await desktop.exec("sh", { args: ["-c", `nohup xdg-open '${reportUrl}' >/dev/null 2>&1 &`] });
      app = "xdg-open";
      ui.ok("opened via xdg-open fallback");
    }

    // Give the page a moment to load, then a little computer-use flourish:
    // nudge the mouse (humanized) so the window has focus before the shot.
    await ui.sleep(6_000);
    await desktop.mouse.click(640, 360, { humanize: true }).catch(() => {});

    const shot = await desktop.screenshot({ format: "png" });
    await writeFile(proofPath, shot, "utf8");
    ui.ok(`proof screenshot → ${ui.bold(path.basename(proofPath))} (${shot.byteLength.toLocaleString()} bytes)`);

    return { sessionId: desktop.sessionId, streamUrl: desktop.streamUrl, proofPath, app };
  } finally {
    // close() drops only the local channel; destroy() ends the session.
    desktop.close();
    await client.destroy(desktop.sessionId);
    ui.ok("desktop destroyed");
  }
}
