/** One-off: kill the sandbox id stored in artifacts/run.json (frees the free-plan slot). */
import { readFileSync } from "node:fs";
import { SolariClient } from "@solarisdk/sdk";

const sid = JSON.parse(readFileSync("artifacts/run.json", "utf8")).forge.sandboxId as string;
const pt = new SolariClient({ apiKey: process.env.SOLARI_API_KEY! });
await pt.sandboxes.kill(sid);
console.log("killed", sid.slice(0, 24) + "…");
