// Проверка через публичные CORS-прокси
const target = "https://miss-rp-game.up.railway.app";

const proxies = [
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];

for (const p of proxies) {
  try {
    const res = await fetch(p + encodeURIComponent(target), {
      signal: AbortSignal.timeout(45000),
    });
    const text = await res.text();
    console.log(p.slice(8, 30), "status:", res.status, "| len:", text.length);
    if (text.includes("MISS RP")) {
      console.log("  >>> MISS RP branding found!");
      console.log("  >>> intro text:", text.includes("начинающий проект"));
      console.log("  >>> logo:", text.includes("/logo-miss.png"));
    } else {
      console.log("  >>> sample:", text.slice(0, 150));
    }
  } catch (e) {
    console.log(p.slice(8, 30), "err:", e.message.slice(0, 80));
  }
}
