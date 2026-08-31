import type { RunResult } from "./types.js";

export const REPO_URL = "https://github.com/crazydude123/the-intern";
export const REPORT_URL = "https://crazydude123.github.io/the-intern/";

/**
 * The shameless part. `the-intern --post` prints these with the live report
 * URL baked in. Edit the voice to taste; the receipts are real.
 */
export function xPost(run: RunResult): string {
  const live = run.forge.reportUrl
    ? `\nLive right now off a Solari sandbox: ${run.forge.reportUrl}`
    : "";
  return [
    `You're hiring a $300K intern.`,
    ``,
    `I didn't apply. I built one.`,
    ``,
    `THE INTERN runs on @getsolari's stack. One command → three microVMs do a full work cycle:`,
    ``,
    `1. a cloud browser reads every source`,
    `2. a sandbox microVM writes the report and serves it on a public URL`,
    `3. a cloud desktop opens it in real Chrome and screenshots it as proof`,
    ``,
    `Here's the report my intern shipped. No human touched it:${live}`,
    REPORT_URL,
    ``,
    `Repo: ${REPO_URL}`,
    ``,
    `@harrychow_ — open to intern vs intern. Mine's available immediately 🧢`,
  ].join("\n");
}

export function linkedInPost(run: RunResult): string {
  const live = run.forge.reportUrl ? `\n\nLive off a Solari sandbox right now: ${run.forge.reportUrl}` : "";
  return [
    `I applied to the Pinetree Research x Solari $300K internship challenge — by not applying.`,
    ``,
    `I built THE INTERN: an autonomous agent that does the job on Solari's own stack (browsers + sandboxes + desktops, one API key):`,
    ``,
    `→ RECON: a cloud browser visits every source, reads it, screenshots it`,
    `→ FORGE: a sandbox microVM boots in under a second, renders a full report from the recon data, and publishes it to a public URL`,
    `→ DELIVER: a cloud desktop opens the live report in real Chrome and captures proof — watchable over live VNC`,
    ``,
    `Report my intern shipped: ${REPORT_URL}${live}`,
    `Open source: ${REPO_URL}`,
    ``,
    `Built with AI, shipped with AI. The repo is the application.`,
    ``,
    `@harrychow_ @getsolari — happy to put my intern up against any human applicant. It never sleeps and it's already shipped.`,
  ].join("\n");
}
