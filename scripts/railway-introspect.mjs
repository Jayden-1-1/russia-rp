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
  "{ __type(name: \"ServiceUpdateInput\") { inputFields { name } } " +
  "__schema { mutationType { fields { name } } } }";
const data = await gql(q, {});
console.log("ServiceUpdateInput:", JSON.stringify(data.__type?.inputFields?.map((f) => f.name)));
console.log("mutations:", JSON.stringify(data.__schema.mutationType.fields.map((f) => f.name)));
