import http from "node:http";
import https from "node:https";

const probe = (mod, port) =>
  new Promise((resolve) => {
    const req = mod.get(
      { host: "obr-site-production.up.railway.app", port, timeout: 15000 },
      (res) => { res.resume(); resolve(port + " -> " + res.statusCode); }
    );
    req.on("timeout", () => { req.destroy(); resolve(port + " -> timeout"); });
    req.on("error", (e) => resolve(port + " -> " + e.code));
  });

console.log(await probe(http, 80));
console.log(await probe(https, 443));
