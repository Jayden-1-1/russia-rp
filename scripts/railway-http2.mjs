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

// HTTP-логи последнего деплоя — запросы к домену и коды ответов
const q =
  "query L($deploymentId: String!, $limit: Int) {" +
  "  httpLogs(deploymentId: $deploymentId, limit: $limit) { host path httpStatus timestamp }" +
  "}";
const data = await gql(q, { deploymentId: "bbaa85aa-ea67-4b00-965c-cb5aa2b22195", limit: 30 });
const logs = data.httpLogs ?? [];
console.log("total http log entries:", logs.length);
for (const l of logs.slice(-15)) {
  console.log(l.timestamp, "|", l.host, "|", l.path, "|", l.httpStatus);
}
