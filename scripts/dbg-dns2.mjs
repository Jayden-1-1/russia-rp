import dns from "node:dns/promises";
const addrs = await dns.resolve4("obr-site-production.up.railway.app").catch(() => []);
console.log("DNS:", addrs);
