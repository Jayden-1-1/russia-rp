import { readFileSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const cfg = JSON.parse(readFileSync(join(os.homedir(), ".railway", "config.json"), "utf-8"));
const token = cfg.user?.accessToken ?? cfg.user?.token;

async function gql(query, variables) {
  const res = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const deployId = process.argv[2] ?? "0b4d8875-3773-4789-9cf9-e956e7da7672";
const q =
  "query L($deployId: String!, $limit: Int) {" +
  "  deploymentLogs(deploymentId: $deployId, limit: $limit) { message }" +
  "}";
const data = await gql(q, { deployId, limit: 200 });
const logs = (data.deploymentLogs ?? []).map((l) => l.message).join("\n");
console.log(logs.slice(-3500) || "empty");
