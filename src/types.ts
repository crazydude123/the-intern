/** Shared types for THE INTERN's three-phase pipeline. */

export type RunMode = "live" | "dry-run";

/** What the RECON phase (Solari browser) extracted from one source. */
export interface SourceFinding {
  url: string;
  label: string;
  title: string;
  heading: string;
  status: "ok" | "failed";
  error?: string;
  /** Size of the extracted text, in characters. */
  bytes: number;
  /** First chunk of the page's visible text. */
  excerpt: string;
  /** Path of a saved screenshot, relative to the artifacts dir. */
  screenshot?: string;
  elapsedMs: number;
}

/** Everything the browser phase learned, handed to the sandbox. */
export interface ReconFindings {
  goal: string;
  mode: RunMode;
  startedAt: string;
  finishedAt: string;
  /** Egress IP the target sites actually saw (the proxy's, not ours). */
  egress: string;
  sources: SourceFinding[];
}

/** What the FORGE phase (Solari sandbox) produced. */
export interface ForgeResult {
  sandboxId: string;
  /** Public URL of the published report (null in dry-run — no gateway). */
  reportUrl: string | null;
  /** Local copy of the rendered report. */
  reportPath: string;
  reportBytes: number;
}

/** What the DELIVER phase (Solari desktop) produced. */
export interface DeliverResult {
  sessionId: string;
  /** Live VNC stream — paste it into a VNC viewer to watch the intern work. */
  streamUrl?: string;
  /** Screenshot proving the report is live on a real screen. */
  proofPath?: string;
  /** Which app the intern opened to display the report. */
  app?: string;
}

export interface RunResult {
  mode: RunMode;
  goal: string;
  startedAt: string;
  finishedAt: string;
  recon: ReconFindings;
  forge: ForgeResult;
  deliver: DeliverResult;
  /** Wall-clock per phase, in ms. */
  timings: { reconMs: number; forgeMs: number; deliverMs: number; totalMs: number };
}
