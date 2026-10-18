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
  "  deployment(id: $deployId) {" +
  "    meta" +
  "    instances { id status logs { edges { node { message } } } }" +
  "  }" +
  "}";

const deployId = process.argv[2] ?? "2e8cacc6-bc24-4021-ac55-2f2c6f00b476";
const data = await gql(q, { deployId });
const d = data.deployment;
console.log("meta:", JSON.stringify(d.meta).slice(0, 500));
for (const inst of d.instances ?? []) {
  console.log("instance:", inst.id, inst.status);
  const msgs = (inst.logs?.edges ?? []).map((x) => x.node.message);
  console.log(msgs.slice(-80).join("\n"));
}
