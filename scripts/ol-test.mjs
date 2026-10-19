import https from "node:https";
const req = https.get(
  { host: "onelocal.host", path: "/", timeout: 45000, headers: { "User-Agent": "Mozilla/5.0" } },
  (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log("status:", res.statusCode, "len:", body.length);
      const t = body.match(/<title>(.*?)<\/title>/);
      console.log("title:", t ? t[1] : "?");
    });
  }
);
req.on("timeout", () => { req.destroy(); console.log("timeout"); });
req.on("error", (e) => console.log("error:", e.code));