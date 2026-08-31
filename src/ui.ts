/**
 * Zero-dependency terminal UI. THE INTERN logs like it means it:
 * phase banners, streaming step lines, timings. ANSI only, no deps.
 */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

export function bold(s: string): string {
  return `${BOLD}${s}${RESET}`;
}
export function dim(s: string): string {
  return `${DIM}${s}${RESET}`;
}
export function green(s: string): string {
  return `${GREEN}${s}${RESET}`;
}
export function red(s: string): string {
  return `${RED}${s}${RESET}`;
}
export function yellow(s: string): string {
  return `${YELLOW}${s}${RESET}`;
}
export function cyan(s: string): string {
  return `${CYAN}${s}${RESET}`;
}
export function magenta(s: string): string {
  return `${MAGENTA}${s}${RESET}`;
}

export const BANNER = `
  ${magenta("█▀▀")} ${magenta("▀█▀")} ${magenta("█▀█")} ${magenta("█▀▄▀█")} ${cyan("█▀█")} ${cyan("█▀▄")} ${cyan("▀█▀")} ${cyan("█▀█")} ${cyan("█ █")}
  ${magenta("█▄▄")} ${magenta(" █ ")} ${magenta("█▄█")} ${magenta("█ ▀ █")} ${cyan("█▀▄")} ${cyan("█▄▀")} ${cyan(" █ ")} ${cyan("█▀▄")} ${cyan("▀▄▀")}
  ${dim("the autonomous intern · built on Solari browsers + sandboxes + desktops")}
`;

export function phase(n: number, name: string, subtitle: string): void {
  const line = `${magenta(`┌─[ PHASE ${n} · ${name} ]`)}`;
  console.log(`\n${line}${"─".repeat(Math.max(4, 62 - line.replace(/\x1b\[\d+m/g, "").length))}${magenta("┐")}`);
  console.log(`${bold(`  ${name}`)} ${dim(subtitle)}`);
}

export function phaseEnd(): void {
  console.log(`${magenta("└" + "─".repeat(66) + "┘")}`);
}

export function ok(msg: string): void {
  console.log(`  ${green("✓")} ${msg}`);
}

export function fail(msg: string): void {
  console.log(`  ${red("✗")} ${msg}`);
}

export function info(msg: string): void {
  console.log(`  ${cyan("·")} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`  ${yellow("!")} ${msg}`);
}

export function kv(key: string, value: string): void {
  console.log(`  ${dim(key.padEnd(14))} ${bold(value)}`);
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
