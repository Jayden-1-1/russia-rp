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
  "mutation Deploy($input: GitHubRepoDeployInput!) { githubRepoDeploy(input: $input) }";

const data = await gql(q, {
  input: {
    projectId: "f4f42edd-81e7-43fe-8db5-da85c67a091e",
    repo: "Jayden-1-1/russia-rp",
    branch: "main",
    environmentId: "371b89a3-5dbc-4893-8ddf-268ff0c0f4bc",
  },
});
console.log("result:", JSON.stringify(data));
