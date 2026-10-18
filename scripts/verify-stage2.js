/**
 * E2E этапа 2 (практика для билдеров):
 * ключ → регистрация → назначение (builder) → начало → админ взял →
 * кандидат «Готов ко 2 туру» → у админа окно «Запустить 2 этап» → запуск →
 * кандидат видит задание + таймер 60:00 → полоса уменьшается.
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
        body: JSON.stringify({ purpose: "call", maxUses: 2, note: "stage2-e2e", expiresDays: 1 }),
      });
      return (await r.json()).data.code;
    });

    const ctx = await browser.createBrowserContext();
    const c = await ctx.newPage();
    await c.goto(BASE + "/login", { waitUntil: "networkidle0" });
    await c.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const login = "s2_" + Date.now();
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

    // Назначение builder
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

    // Админ берёт
    await admin.goto(BASE + "/admin", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 5500));
    await admin.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Взять обзвон"))?.click();
    });
    await new Promise((r) => setTimeout(r, 3000));

    // Кандидат: ждём игру + кнопку 2 тура
    await new Promise((r) => setTimeout(r, 6000));
    let t = await c.evaluate(() => document.body.textContent);
    check(t.includes("Готов ко 2 туру"), "'Ready for stage 2' button visible");

    // Кандидат жмёт готовность
    await c.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Готов ко 2 туру"))?.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    t = await c.evaluate(() => document.body.textContent);
    check(t.includes("Ждём запуск практики") || t.includes("ОЖИДАНИЕ 2 ЭТАПА"), "Candidate waits for stage 2 launch");

    // Админ: окно «Кандидат готов ко 2 туру»
    await new Promise((r) => setTimeout(r, 5500));
    t = await admin.evaluate(() => document.body.textContent);
    check(t.includes("КАНДИДАТ ГОТОВ КО 2 ТУРУ") || t.includes("Кандидат готов ко 2 туру"), "Stage2 modal appeared for admin");

    // Запуск 2 этапа
    await admin.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Запустить 2 этап"))?.click();
    });
    await new Promise((r) => setTimeout(r, 2500));

    // Кандидат: задание + таймер
    await new Promise((r) => setTimeout(r, 6000));
    t = await c.evaluate(() => document.body.textContent);
    check(t.includes("ЗАДАНИЕ 2 ЭТАПА") || t.includes("Задание 2 этапа"), "Practice task shown");
    check(
      t.includes("Магазин") || t.includes("Квест") || t.includes("Локация"),
      "One of 3 random tasks displayed"
    );
    check(t.includes("ТРЕБОВАНИЯ"), "Requirements list shown");

    const timer = await c.evaluate(() => {
      const p = [...document.querySelectorAll("p")].find((x) => /\d{2}:\d{2}:\d{2}/.test(x.textContent ?? ""));
      return p?.textContent ?? null;
    });
    check(timer !== null && timer.startsWith("00:5"), "Timer running near 60 min: " + timer);

    // Полоса уменьшается: измерим дважды (ищем внутренний div полосы прогресса)
    const getBarWidth = () =>
      c.evaluate(() => {
        const bars = [...document.querySelectorAll("div")].filter(
          (d) =>
            d.className.toString().includes("transition") &&
            d.parentElement?.className.toString().includes("overflow-hidden")
        );
        return bars.length ? bars[0].getBoundingClientRect().width : null;
      });
    const w1 = await getBarWidth();
    await new Promise((r) => setTimeout(r, 3200));
    const w2 = await getBarWidth();
    check(
      w1 !== null && w2 !== null && w2 < w1,
      "Progress bar shrinking (" + w1 + " → " + w2 + ")"
    );

    await c.screenshot({ path: "verify-stage2.png" });
    await browser.close();
    console.log(failures === 0 ? "\nSTAGE2 E2E ALL PASS" : `\nFAILURES: ${failures}`);
    process.exit(failures === 0 ? 0 : 1);
  } catch (e) {
    console.error("E2E ERROR:", e.message);
    await browser.close().catch(() => {});
    process.exit(1);
  }
})();
