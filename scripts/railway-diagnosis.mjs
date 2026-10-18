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

const deployId = process.argv[2] ?? "3aef1931-4c01-4654-a570-6f14bc0bf796";

const q =
  "query D($deployId: String!) {" +
  "  deployment(id: $deployId) { status diagnosis }" +
  "}";

const data = await gql(q, { deployId });
console.log(JSON.stringify(data, null, 1).slice(0, 3000));
