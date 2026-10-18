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
  "{ m: __schema { mutationType { fields { name } } } " +
  "a: __type(name: \"ServiceConnectInput\") { inputFields { name } } }";
const data = await gql(q, {});
console.log("ServiceConnectInput:", JSON.stringify(data.a?.inputFields?.map((f) => f.name)));
const sc = data.m.mutationType.fields.find((f) => f.name === "serviceConnect");
console.log("serviceConnect exists:", Boolean(sc));
const si = data.m.mutationType.fields.find((f) => f.name === "serviceInstanceUpdate");
console.log("serviceInstanceUpdate exists:", Boolean(si));
