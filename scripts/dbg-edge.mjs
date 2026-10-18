import net from "node:net";

const tryConnect = (host, port) =>
  new Promise((resolve) => {
    const s = net.connect({ host, port, timeout: 8000 });
    s.on("connect", () => { s.destroy(); resolve("TCP OK"); });
    s.on("timeout", () => { s.destroy(); resolve("TCP TIMEOUT"); });
    s.on("error", (e) => resolve("TCP ERR " + e.code));
  });

console.log(".12:443", await tryConnect("69.46.46.12", 443));
console.log(".126:443", await tryConnect("69.46.46.126", 443));
