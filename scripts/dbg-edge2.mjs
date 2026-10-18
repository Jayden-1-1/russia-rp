import dns from "node:dns/promises";
import https from "node:https";

const probe = (host) =>
  new Promise((resolve) => {
    const req = https.get(
      { host, timeout: 12000 },
      (res) => { res.resume(); resolve(host + " -> " + res.statusCode); }
    );
    req.on("timeout", () => { req.destroy(); resolve(host + " -> timeout"); });
    req.on("error", (e) => resolve(host + " -> " + e.code));
  });

const hosts = [
  "miss-rp-game.up.railway.app",
  "docs.railway.app",
];
for (const h of hosts) {
  const ip = await dns.resolve4(h).catch(() => ["?"]);
  console.log(h, "DNS:", ip[0], "|", await probe(h));
}
