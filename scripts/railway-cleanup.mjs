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

const PROJECT_ID = "f4f42edd-81e7-43fe-8db5-da85c67a091e";
const ENV_ID = "371b89a3-5dbc-4893-8ddf-268ff0c0f4bc";
const SERVICE_ID = "a1e716de-4da7-4a68-811b-8fd912dfc815"; // obr-site (с volume и env)
const REPO = "Jayden-1-1/russia-rp";

// 1. Удаляем лишние сервисы
for (const extraId of ["40828dbd-4051-46c8-ac33-aed3636b64d5", "d713aecc-184c-4e80-a4e1-cc5876040bd2"]) {
  try {
    await gql(
      "mutation Del($id: String!) { serviceDelete(id: $id) }",
      { id: extraId }
    );
    console.log("deleted:", extraId);
  } catch (e) {
    console.log("delete failed:", extraId, e.message.slice(0, 200));
  }
}

// 2. Подключаем репозиторий к obr-site
const connected = await gql(
  "mutation Connect($id: String!, $input: ServiceConnectInput!) {" +
  "  serviceConnect(id: $id, input: $input) { id }" +
  "}",
  { id: SERVICE_ID, input: { repo: REPO, branch: "main" } }
);
console.log("connected:", JSON.stringify(connected));

// 3. Деплой последнего коммита
const deployed = await gql(
  "mutation Deploy($serviceId: String!, $environmentId: String!, $latestCommit: Boolean) {" +
  "  serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId, latestCommit: $latestCommit) { id }" +
  "}",
  { serviceId: SERVICE_ID, environmentId: ENV_ID, latestCommit: true }
);
console.log("deployed:", JSON.stringify(deployed));
