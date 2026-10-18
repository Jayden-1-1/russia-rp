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
  "{ m1: __type(name: \"GithubRepoDeployInput\") { inputFields { name } } " +
  "m2: __type(name: \"Mutation\") { fields { name args { name } } } }";
const data = await gql(q, {});
console.log("GithubRepoDeployInput:", JSON.stringify(data.m1?.inputFields?.map((f) => f.name)));
const githubDeploy = data.m2.fields.find((f) => f.name === "githubRepoDeploy");
console.log("githubRepoDeploy args:", JSON.stringify(githubDeploy?.args?.map((a) => a.name)));
