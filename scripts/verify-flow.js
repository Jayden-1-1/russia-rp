/**
 * E2E полный цикл: ключ обзвона → регистрация → ожидание → назначение →
 * начало → у кандидата «ждём проверяющего» → админ видит окно «Взять обзвон» →
 * берёт → у кандидата «Ваш обзвон взял» → игра Dino.
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
  let failures = 0;
  const check = (ok, name) => {
    console.log((ok ? "  OK   " : "  FAIL ") + name);
    if (!ok) failures++;
  };

  try {
    // 1. Админ
    const admin = await browser.newPage();
    await admin.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 60000 });
    await admin.type("#login", "admin");
    await admin.type("#password", "admin123");
    await Promise.all([
      admin.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
      admin.click('button[type="submit"]'),
    ]);
    check(admin.url().includes("/cabinet"), "Admin login");

    // 2. Ключ обзвона
    const keyRes = await admin.evaluate(async () => {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "call", maxUses: 5, note: "e2e", expiresDays: 1 }),
      });
      return res.json();
    });
    check(keyRes.ok, "Call key created");
    const keyCode = keyRes.data.code;

    // 3. Кандидат по ключу
    const candCtx = await browser.createBrowserContext();
    const cand = await candCtx.newPage();
    await cand.goto(BASE + "/login", { waitUntil: "networkidle0", timeout: 60000 });
    await cand.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const login = "e2e_" + Date.now();
    await cand.type("#code", keyCode);
    await cand.type("#newlogin", login);
    await cand.type("#newpassword", "test12345");
    await Promise.all([
      cand.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
      cand.evaluate(() => {
        const forms = [...document.querySelectorAll("form")];
        forms[forms.length - 1].querySelector('button[type="submit"]').click();
      }),
    ]);
    check(cand.url().includes("/calls/wait"), "Registered via call key -> /calls/wait");
    let t = await cand.evaluate(() => document.body.textContent);
    check(t.includes("Ожидайте своего обзвона"), "Waiting room shown");

    // 4. Назначение (правила RP)
    const assignRes = await admin.evaluate(async (lg) => {
      const prof = await fetch("/api/admin/profiles").then((r) => r.json());
      const target = prof.data.profiles.find((p) => p.login === lg);
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, category: "rules" }),
      });
      return res.json();
    }, login);
    check(assignRes.ok, "Assignment created");

    // 5. Кандидат начинает
    await new Promise((r) => setTimeout(r, 6000));
    await cand.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Начать обзвон"))?.click();
    });
    await new Promise((r) => setTimeout(r, 3500));
    t = await cand.evaluate(() => document.body.textContent);
    check(t.includes("Вы начали обзвон"), "Candidate sees 'call started'");
    check(t.includes("Ждём проверяющего") || t.includes("ОЖИДАНИЕ ПРОВЕРЯЮЩЕГО"), "Waiting for examiner shown");

    // 6. Админ: открыта админка — должно всплыть окно «Взять обзвон»
    await admin.goto(BASE + "/admin", { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 5500)); // ждём поллинг
    let at = await admin.evaluate(() => document.body.textContent);
    check(at.includes("КАНДИДАТ ПОДКЛЮЧИЛСЯ") || at.includes("Кандидат подключился"), "Pickup modal appeared for admin");
    check(at.includes("Взять обзвон"), "'Take call' button visible");

    // 7. Админ берёт обзвон
    await admin.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Взять обзвон"))?.click();
    });
    await new Promise((r) => setTimeout(r, 3000));
    const adminUrl = admin.url();
    check(adminUrl.includes("/admin/results"), "Admin redirected to results after claim");

    // 8. Кандидат: плашка «ВАШ ОБЗВОН ВЗЯЛ» → через анимацию игра
    await new Promise((r) => setTimeout(r, 5000)); // поллинг кандидата 4с + анимации
    t = await cand.evaluate(() => document.body.textContent);
    const sawClaim = t.includes("ВАШ ОБЗВОН ВЗЯЛ") || t.includes("Ваш обзвон взял") || t.includes("ПРОВЕРЯЮЩИЙ");
    check(sawClaim, "Claim badge / examiner shown to candidate");
    const gameShown = await cand.evaluate(() => document.querySelector("canvas") !== null);
    check(gameShown, "Dino game canvas present");
    const running = await cand.evaluate(() => {
      const text = document.body.textContent;
      return text.includes("ВЫ СЕЙЧАС ПРОХОДИТЕ ОБЗВОН");
    });
    check(running, "Running state with 'YOU ARE BEING INTERVIEWED'");
    await cand.screenshot({ path: "verify-flow-final.png" });

    await browser.close();
    console.log(failures === 0 ? "\nE2E ALL PASS" : `\nE2E FAILURES: ${failures}`);
    process.exit(failures === 0 ? 0 : 1);
  } catch (e) {
    console.error("E2E ERROR:", e.message);
    await browser.close().catch(() => {});
    process.exit(1);
  }
})();
