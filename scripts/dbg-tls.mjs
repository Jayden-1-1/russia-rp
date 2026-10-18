import https from "node:https";

const req = https.get(
  { host: "miss-rp-game.up.railway.app", timeout: 30000 },
  (res) => {
    console.log("status:", res.statusCode);
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log("MISS RP:", body.includes("MISS RP"));
      console.log("intro:", body.includes("начинающий проект"));
      console.log("logo:", body.includes("/logo-miss.png"));
    });
  }
);
req.on("timeout", () => { console.log("timeout"); req.destroy(); });
req.on("error", (e) => console.log("error:", e.code, e.message));
