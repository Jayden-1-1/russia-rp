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
  "query Deployments($envId: String!) {" +
  "  environment(id: $envId) {" +
  "    deployments { edges { node { id status createdAt } } }" +
  "  }" +
  "}";

const data = await gql(q, { envId: "371b89a3-5dbc-4893-8ddf-268ff0c0f4bc" });
const edges = data.environment.deployments.edges.slice(0, 5);
for (const e of edges) {
  console.log(e.node.status, "|", e.node.createdAt, "|", e.node.id);
}
