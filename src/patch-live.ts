/**
 * One-off: reconnect to a still-alive sandbox and fix its served root
 * (report.html → index.html) so its preview URL lands on the report.
 * Usage: npx tsx src/patch-live.ts <sandboxId>
 */
import { SolariClient } from "@solarisdk/sdk";
import * as ui from "./ui.js";

const id = process.argv[2];
if (!id) {
  console.error("usage: tsx src/patch-live.ts <sandboxId>");
  process.exit(1);
}

const pt = new SolariClient({ apiKey: process.env.SOLARI_API_KEY! });
const sandbox = await pt.sandboxes.connect(id);
ui.ok(`reconnected to ${id.slice(0, 24)}…`);
await sandbox.connect();
await sandbox.commands.run("sh", {
  args: ["-c", "cd /tmp/intern && cp report.html index.html && ls -la"],
});
ui.ok("index.html in place — preview URL now serves the report");
await sandbox.close();
