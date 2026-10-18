/**
 * Деплой через Railway GraphQL API: подключаем GitHub-репозиторий к сервису
 * и запускаем деплой из ветки main (обход blocked upload-эндпоинта CLI).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const cfg = JSON.parse(
  readFileSync(join(os.homedir(), ".railway", "config.json"), "utf-8")
);
const token = cfg.user?.accessToken ?? cfg.user?.digitalTokenToken ?? cfg.user?.token;
if (!token) {
  console.error("token not found. user keys:", Object.keys(cfg.user ?? {}));
  process.exit(1);
}

const PROJECT_ID = "f4f42edd-81e7-43fe-8db5-da85c67a091e";
const ENV_ID = "371b89a3-5dbc-4893-8ddf-268ff0c0f4bc";
const SERVICE_ID = "a1e716de-4da7-4a68-811b-8fd912dfc815";
const REPO = "Jayden-1-1/russia-rp";
const BRANCH = "main";

async function gql(query, variables) {
  const res = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const setSourceQuery =
  "mutation SetServiceSource($serviceId: String!, $projectId: String!, $repo: String!, $branch: String!) {" +
  "  serviceUpdate(id: $serviceId, projectId: $projectId," +
  "    input: { source: { repo: $repo, branch: $branch } }) { id }" +
  "}";

const deployQuery =
  "mutation Deploy($serviceId: String!, $environmentId: String!) {" +
  "  deploymentCreate(input: { environmentId: $environmentId, serviceId: $serviceId }) { id status }" +
  "}";

const setSource = await gql(setSourceQuery, {
  serviceId: SERVICE_ID,
  projectId: PROJECT_ID,
  repo: REPO,
  branch: BRANCH,
});
console.log("service source set:", JSON.stringify(setSource));

const deploy = await gql(deployQuery, {
  serviceId: SERVICE_ID,
  environmentId: ENV_ID,
});
console.log("deployment:", JSON.stringify(deploy));
