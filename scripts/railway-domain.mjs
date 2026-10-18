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

// Introspect serviceDomainCreate input
const q = '{ __type(name: "ServiceDomainCreateInput") { inputFields { name } } }';
const data = await gql(q, {});
console.log("ServiceDomainCreateInput:", JSON.stringify(data.__type?.inputFields?.map((f) => f.name)));

// Create domain miss-rp-game on service
try {
  const created = await gql(
    "mutation D($serviceId: String!, $input: ServiceDomainCreateInput!) {" +
    "  serviceDomainCreate(serviceId: $serviceId, input: $input) { domain status }" +
    "}",
    {
      serviceId: "a1e716de-4da7-4a68-811b-8fd912dfc815",
      input: { domain: "miss-rp-game" },
    }
  );
  console.log("created:", JSON.stringify(created));
} catch (e) {
  console.log("create failed:", e.message.slice(0, 300));
}
