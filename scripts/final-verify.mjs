import https from "node:https";
const req = https.get(
  { host: "obr-site-production.up.railway.app", timeout: 45000 },
  (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => console.log("OK", res.statusCode, "| MISS RP:", body.includes("MISS RP")));
  }
);
req.on("timeout", () => { req.destroy(); console.log("timeout"); });
req.on("error", (e) => console.log("error:", e.code));