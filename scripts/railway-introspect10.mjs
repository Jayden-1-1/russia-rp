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
  "{ q1: __type(name: \"DeploymentLogsQueryInput\") { inputFields { name } } " +
  "q2: __type(name: \"BuildLogsQueryInput\") { inputFields { name } } " +
  "q3: __schema { queryType { fields { name args { name } } } } }";
const data = await gql(q, {});
console.log("DeploymentLogsQueryInput:", JSON.stringify(data.q1?.inputFields?.map((f) => f.name)));
console.log("BuildLogsQueryInput:", JSON.stringify(data.q2?.inputFields?.map((f) => f.name)));
const dl = data.q3.queryType.fields.find((f) => f.name === "deploymentLogs");
const bl = data.q3.queryType.fields.find((f) => f.name === "buildLogs");
console.log("deploymentLogs args:", JSON.stringify(dl?.args?.map((a) => a.name)));
console.log("buildLogs args:", JSON.stringify(bl?.args?.map((a) => a.name)));
