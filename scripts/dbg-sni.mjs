import https from "node:https";

// Подключаемся к работающему edge .126, но SNI = miss-rp-game
const req = https.get(
  {
    host: "69.46.46.126",
    servername: "miss-rp-game.up.railway.app",
    path: "/",
    timeout: 15000,
    headers: { Host: "miss-rp-game.up.railway.app" },
  },
  (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log("status:", res.statusCode);
      console.log("MISS RP:", body.includes("MISS RP"));
      console.log("logo:", body.includes("logo-miss.png"));
    });
  }
);
req.on("timeout", () => { req.destroy(); console.log("timeout"); });
req.on("error", (e) => console.log("error:", e.code));
