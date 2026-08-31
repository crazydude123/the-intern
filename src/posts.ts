import type { RunResult } from "./types.js";

/**
 * The shameless part. `the-intern --post` prints these with the live report
 * URL baked in. Edit the voice to taste; the receipts are real.
 */
export function xPost(run: RunResult): string {
  const url = run.forge.reportUrl
    ? run.forge.reportUrl
    : "(dry-run — no live URL; set SOLARI_API_KEY and run for real)";
  return [
    `You're hiring a $300K intern.`,
    ``,
    `I didn't apply. I built one.`,
    ``,
    `THE INTERN is an autonomous agent on @getsolari's stack. One command and three microVMs do a full work cycle:`,
    ``,
    `1. a stealth browser w/ residential proxy reads the brief + every source`,
    `2. a sandbox microVM writes the report and publishes it to a public URL`,
    `3. a cloud desktop opens it in real Chrome and screenshots it as proof`,
    ``,
    `Here's the report my intern shipped, end to end, no human touched it:`,
    url,
    ``,
    `Repo: github.com/YOUR_HANDLE/the-intern`,
    ``,
    `@harrychow_ — interview slot or intern vs intern? mine works 24/7 and doesn't ask for equity 🧢`,
    `#buildinpublic #AIagents #Solari`,
  ].join("\n");
}

export function linkedInPost(run: RunResult): string {
  const url = run.forge.reportUrl ?? "(dry-run — no live URL)";
  return [
    `I applied to the Pinetree Research x Solari $300K internship challenge — by not applying.`,
    ``,
    `Instead, I built THE INTERN: an autonomous agent that does the job on Solari's own stack (browsers + sandboxes + desktops, one API key):`,
    ``,
    `→ RECON: a stealth cloud browser with residential proxy egress visits every source, reads it, screenshots it`,
    `→ FORGE: a sandbox microVM boots in ~1s, renders a full HTML report from the recon data, and publishes it to a public URL`,
    `→ DELIVER: a cloud desktop opens the live report in real Chrome and captures a proof screenshot — with a VNC stream you can watch live`,
    ``,
    `The report my intern shipped is here: ${url}`,
    `Everything is open source: github.com/YOUR_HANDLE/the-intern`,
    ``,
    `Built with AI, shipped with AI — the repo IS the application.`,
    ``,
    `@harrychow_ @getsolari — happy to put my intern up against any human applicant. It's available immediately and it never sleeps.`,
  ].join("\n");
}
