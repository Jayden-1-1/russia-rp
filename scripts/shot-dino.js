/**
 * Полный проход до состояния игры и скриншот ТОЛЬКО канваса —
 * чтобы проверить, как выглядит динозавр.
 */
const puppeteer = require("puppeteer-core");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3002";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  // Админ
  const admin = await browser.newPage();
  await admin.goto(BASE + "/login", { waitUntil: "networkidle0" });
  await admin.type("#login", "admin");
  await admin.type("#password", "admin123");
  await Promise.all([
    admin.waitForNavigation({ waitUntil: "networkidle0" }),
    admin.click("button[type=submit]"),
  ]);
  const key = await admin.evaluate(async () => {
    const r = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "call", maxUses: 3, note: "dino-shot", expiresDays: 1 }),
    });
    return (await r.json()).data.code;
  });
  // Кандидат
  const ctx = await browser.createBrowserContext();
  const c = await ctx.newPage();
  await c.goto(BASE + "/login", { waitUntil: "networkidle0" });
  await c.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const login = "shot_" + Date.now();
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
  // Назначение (builder = 25 вопросов)
  await admin.evaluate(async (lg) => {
    const prof = await fetch("/api/admin/profiles").then((r) => r.json());
    const t = prof.data.profiles.find((u) => u.login === lg);
    await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: t.id, category: "builder" }),
    });
  }, login);
  await new Promise((r) => setTimeout(r, 6000));
  await c.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Начать обзвон"))?.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
  // Админ берёт обзвон
  await admin.goto(BASE + "/admin", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 5500));
  await admin.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Взять обзвон"))?.click();
  });
  // Кандидат: ждём анимацию + появление игры
  await new Promise((r) => setTimeout(r, 9000));
  // Скриншот канваса
  const canvas = await c.$("canvas");
  if (canvas) {
    await canvas.screenshot({ path: "dino-canvas.png" });
    console.log("canvas screenshot saved");
  } else {
    console.log("NO CANVAS — page text:", (await c.evaluate(() => document.body.textContent)).slice(0, 200));
  }
  await c.screenshot({ path: "dino-page.png" });
  await browser.close();
})();
