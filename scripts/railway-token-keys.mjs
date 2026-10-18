import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const projDir = join(os.homedir(), ".railway", "sessions");
for (const f of readdirSync(projDir)) {
  const raw = JSON.parse(readFileSync(join(projDir, f), "utf-8"));
  console.log(f, "=> keys:", Object.keys(raw));
}
