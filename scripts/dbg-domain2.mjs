import dns from "node:dns/promises";

const addrs = await dns.resolve4("miss-rp-game.up.railway.app").catch(() => []);
console.log("DNS now:", addrs);
try {
  const res = await fetch("https://miss-rp-game.up.railway.app", {
    signal: AbortSignal.timeout(30000),
  });
  console.log("status:", res.status);
  if (res.status === 200) {
    const html = await res.text();
    console.log("MISS RP:", html.includes("MISS RP"));
    console.log("intro:", html.includes("начинающий проект"));
  }
} catch (e) {
  console.log("fetch:", e.cause?.code ?? e.message);
}
