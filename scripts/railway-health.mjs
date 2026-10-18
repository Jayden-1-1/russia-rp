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

const q =
  "query D($deployId: String!) {" +
  "  deployment(id: $deployId) { status url }" +
  "}";
const data = await gql(q, { deployId: "c0535499-7177-4d30-9a0f-6d39f1b2379a" });
console.log("deployment:", JSON.stringify(data.deployment));

const q3 =
  "query L($deployId: String!, $limit: Int) {" +
  "  httpLogs(deploymentId: $deployId, limit: $limit) { message }" +
  "}";
try {
  const data3 = await gql(q3, { deployId: "c0535499-7177-4d30-9a0f-6d39f1b2379a", limit: 20 });
  const logs = (data3.httpLogs ?? []).map((l) => l.message).slice(-10);
  console.log("http logs:", logs.join(" | "));
} catch (e) {
  console.log("http logs err:", e.message.slice(0, 200));
}
