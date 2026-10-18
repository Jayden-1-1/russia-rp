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

const q2 =
  "query D($projectId: String!, $environmentId: String!, $serviceId: String!) {" +
  "  domains(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId) {" +
  "    domain suffix newDomainName newHostLabel targetPort syncStatus" +
  "  }" +
  "}";
const data2 = await gql(q2, {
  projectId: "f4f42edd-81e7-43fe-8db5-da85c67a091e",
  environmentId: "371b89a3-5dbc-4893-8ddf-268ff0c0f4bc",
  serviceId: "a1e716de-4da7-4a68-811b-8fd912dfc815",
});
console.log("domains:", JSON.stringify(data2, null, 1));
