const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const p = await browser.newPage();
  // Логин кандидатом из прошлого E2E — вместо этого зайдём админом и создадим нового
  await p.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await p.type("#login", "admin");
  await p.type("#password", "admin123");
  await Promise.all([
    p.waitForNavigation({ waitUntil: "networkidle0" }),
    p.click("button[type=submit]"),
  ]);
  // Ключ обзвона
  const key = await p.evaluate(async () => {
    const r = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "call", maxUses: 5, note: "dino-check", expiresDays: 1 }),
    });
    return (await r.json()).data.code;
  });
  // Кандидат
  const ctx = await browser.createBrowserContext();
  const c = await ctx.newPage();
  await c.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await c.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const login = "dino_" + Date.now();
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
  // Назначение
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
  // Старт игры: пробел
  await c.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 300));
  // Прыжок: скрин в середине прыжка
  await c.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 250));
  await c.screenshot({ path: "verify-dino-jump.png" });
  // Через секунду — динозавр должен вернуться на землю
  await new Promise((r) => setTimeout(r, 900));
  await c.screenshot({ path: "verify-dino-land.png" });
  await new Promise((r) => setTimeout(r, 1500));
  await c.screenshot({ path: "verify-dino-run.png" });
  await browser.close();
  console.log("dino screenshots saved");
})();
