import { readFileSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const cfgPath = join(os.homedir(), ".railway", "config.json");
const raw = JSON.parse(readFileSync(cfgPath, "utf-8"));
console.log("config.json keys:", Object.keys(raw));
if (raw.accounts) {
  for (const [k, v] of Object.entries(raw.accounts)) {
    console.log("account", k, "keys:", Object.keys(v));
  }
}
