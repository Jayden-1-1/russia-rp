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
  "query P($projectId: String!) {" +
  "  project(id: $projectId) {" +
  "    services { edges { node { id name serviceInstances { edges { node { id source { image repo } } } } } } }" +
  "  }" +
  "}";

const data = await gql(q, { projectId: "f4f42edd-81e7-43fe-8db5-da85c67a091e" });
for (const e of data.project.services.edges) {
  const node = e.node;
  const inst = node.serviceInstances.edges[0]?.node;
  console.log(
    "service:", node.name,
    "| id:", node.id,
    "| instance:", inst?.id,
    "| source:", JSON.stringify(inst?.source)
  );
}
