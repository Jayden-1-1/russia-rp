import https from "node:https";

const tryOnce = () =>
  new Promise((resolve) => {
    const req = https.get(
      {
        host: "miss-rp-game.up.railway.app",
        path: "/",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve(
            "status " + res.statusCode +
            " | MISS RP: " + body.includes("MISS RP") +
            " | logo: " + body.includes("logo-miss.png")
          )
        );
      }
    );
    req.on("timeout", () => { req.destroy(); resolve("timeout"); });
    req.on("error", (e) => resolve("error " + e.code));
  });

console.log(await tryOnce());
