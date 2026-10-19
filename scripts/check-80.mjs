import http from "node:http";
const req = http.get(
  { host: "obr-site-production.up.railway.app", port: 80, timeout: 15000 },
  (res) => {
    console.log("HTTP:", res.statusCode, "| Location:", res.headers.location);
    res.resume();
  }
);
req.on("timeout", () => { req.destroy(); console.log("timeout"); });
req.on("error", (e) => console.log("error:", e.code));