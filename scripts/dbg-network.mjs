const urls = [
  "https://obr-site-production.up.railway.app",
  "https://railway.app",
  "https://miss-rp-game.up.railway.app",
];
for (const u of urls) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(15000), redirect: "manual" });
    console.log(u.slice(8, 40), "->", r.status);
  } catch (e) {
    console.log(u.slice(8, 40), "->", e.cause?.code ?? e.message);
  }
}
