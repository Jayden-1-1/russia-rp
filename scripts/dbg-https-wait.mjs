import https from "node:https";

const tryOnce = () =>
  new Promise((resolve) => {
    const req = https.get(
      { host: "obr-site-production.up.railway.app", timeout: 25000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve("OK " + res.statusCode + " MISS:" + body.includes("MISS RP")));
      }
    );
    req.on("timeout", () => { req.destroy(); resolve("timeout"); });
    req.on("error", (e) => resolve("err " + e.code));
  });

for (let i = 1; i <= 6; i++) {
  const res = await tryOnce();
  console.log("attempt", i, res);
  if (res.startsWith("OK")) break;
  await new Promise((r) => setTimeout(r, 30000));
}
