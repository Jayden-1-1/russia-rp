const BASE = "https://miss-rp-game.up.railway.app";
for (let i = 1; i <= 10; i++) {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(20000) });
    console.log("attempt", i, "->", res.status);
    if (res.status === 200) {
      const html = await res.text();
      console.log("MISS RP:", html.includes("MISS RP"));
      console.log("intro:", html.includes("начинающий проект"));
      console.log("logo:", html.includes("/logo-miss.png"));
      process.exit(0);
    }
  } catch (e) {
    console.log("attempt", i, "->", e.message.slice(0, 80));
  }
  await new Promise((r) => setTimeout(r, 20000));
}
process.exit(1);
