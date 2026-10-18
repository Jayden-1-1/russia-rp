/**
 * Проверка физики прыжка: позиция дино на канвасе по кадрам.
 * Экспортируем состояние игры в window и замеряем dinoY.
 */
const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const p = await browser.newPage();
  await p.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await p.type("#login", "admin");
  await p.type("#password", "admin123");
  await Promise.all([
    p.waitForNavigation({ waitUntil: "networkidle0" }),
    p.click("button[type=submit]"),
  ]);
  const key = await p.evaluate(async () => {
    const r = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "call", maxUses: 5, note: "physics", expiresDays: 1 }),
    });
    return (await r.json()).data.code;
  });
  const ctx = await browser.createBrowserContext();
  const c = await ctx.newPage();
  await c.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await c.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const login = "phys_" + Date.now();
  await c.type("#code", key);
  await c.type("#newlogin", login);
  await c.type("#newpassword", "test12345");
  await Promise.all([
    c.waitForNavigation({ waitUntil: "networkidle0" }),
    c.evaluate(() => {
      const forms = [...document.querySelectorAll("form")];
      forms[forms.length - 1].querySelector('button[type="submit"]').click();
    }),
  ]);
  await p.evaluate(async (lg) => {
    const prof = await fetch("/api/admin/profiles").then((r) => r.json());
    const target = prof.data.profiles.find((u) => u.login === lg);
    await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: target.id, category: "rules" }),
    });
  }, login);
  await new Promise((r) => setTimeout(r, 6000));
  await c.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Начать обзвон"))?.click();
  });
  await new Promise((r) => setTimeout(r, 3000));

  // Стартуем игру и замеряем dinoY покадрово
  const samples = await c.evaluate(async () => {
    // Старт
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    // Через 100мс — прыжок
    await new Promise((r) => setTimeout(r, 200));
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));

    // Извлечь dinoY: рендерер держит state в замыкании — недоступен напрямую.
    // Альтернатива: пиксельный анализ канваса — найдём верхнюю границу белых пикселей дино.
    const canvas = document.querySelector("canvas");
    const ctx2 = canvas.getContext("2d");
    const positions = [];
    const measure = () => {
      const img = ctx2.getImageData(0, 0, canvas.width, canvas.height);
      const data = img.data;
      // ищем белые пиксели в зоне дино (x: 40..130)
      let minY = 99999;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 50; x < 130; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
            if (y < minY) minY = y;
            break;
          }
        }
      }
      positions.push(minY === 99999 ? null : minY);
    };
    // Замеры каждые 80мс в течение 1.2с
    for (let t = 0; t < 15; t++) {
      await new Promise((r) => setTimeout(r, 80));
      measure();
    }
    return positions;
  });

  console.log("dino top-Y по кадрам (меньше = выше):", JSON.stringify(samples));
  // Ожидание: старт ~GROUND-52≈152; в прыжке минимум должен быть < 100; возврат к ~152
  const valid = samples.filter((s) => s !== null);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const last = valid[valid.length - 1];
  console.log("min:", min, "max:", max, "last:", last);
  const groundY = 240 - 36 - 52; // ≈152
  const jumped = min < groundY - 40; // взлетел заметно
  const landed = Math.abs(last - (240 - 36 - 48)) < 25 || last >= groundY - 25;
  console.log("JUMPED:", jumped ? "OK" : "FAIL");
  console.log("LANDED:", landed ? "OK" : "FAIL");
  console.log("NO_FLYAWAY:", min > 20 ? "OK (не улетел за экран)" : "FAIL");

  await browser.close();
  process.exit(jumped && landed && min > 20 ? 0 : 1);
})();
