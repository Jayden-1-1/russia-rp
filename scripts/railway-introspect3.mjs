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
  "{ m2: __type(name: \"Mutation\") { fields { name args { name type { kind name ofType { kind name ofType { name } } } } } } }";
const data = await gql(q, {});
const githubDeploy = data.m2.fields.find((f) => f.name === "githubRepoDeploy");
console.log("args detail:", JSON.stringify(githubDeploy?.args, null, 1));
