/**
 * E2E полного интервью (новый поток):
 * кандидат начинает → админ берёт → ЗА ОБОЗВОНОМ ставит оценки → сохраняет →
 * правила: финальное решение сразу; билдер: «Перейти ко 2 туру» → практика
 * (таймер 1 час) → админ ставит 6 критериев по 2 = 12 → принят.
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
    admin.on("response", async (r) => {
      if (r.url().includes("/grade")) {
        try {
          console.log("[grade]", r.status(), (await r.text()).slice(0, 150));
        } catch {}
      }
    });
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
        body: JSON.stringify({ purpose: "call", maxUses: 4, note: "interview-e2e", expiresDays: 1 }),
      });
      return (await r.json()).data.code;
    });

    // --- Сценарий 1: правила RP (1 тур, сразу финал) ---
    {
      const ctx = await browser.createBrowserContext();
      const c = await ctx.newPage();
      await c.goto(BASE + "/login", { waitUntil: "networkidle0" });
      await c.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const login = "iv_" + Date.now();
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
      await admin.evaluate(async (lg) => {
        const prof = await fetch("/api/admin/profiles").then((r) => r.json());
        const t = prof.data.profiles.find((u) => u.login === lg);
        await fetch("/api/admin/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: t.id, category: "rules" }),
        });
      }, login);
      await new Promise((r) => setTimeout(r, 6000));
      await c.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Начать обзвон"))?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      await admin.goto(BASE + "/admin", { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 5500));
      await admin.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Взять обзвон"))?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));

      await new Promise((r) => setTimeout(r, 6000));
      let t = await c.evaluate(() => document.body.textContent);
      check(t.includes("ВЫ СЕЙЧАС ПРОХОДИТЕ ОБЗВОН"), "Candidate in interview (rules)");

      // 31 вопрос × 2 балла = 62 → принят
      await admin.goto(BASE + "/admin/results", { waitUntil: "networkidle0" });
      await admin.evaluate(() => {
        [...document.querySelectorAll("button[aria-expanded]")][0]?.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
      const clicked = await admin.evaluate(async () => {
        const btns = [...document.querySelectorAll("button")].filter((b) =>
          b.getAttribute("aria-label") === "Оценка 2 балла"
        );
        for (const b of btns) {
          b.click();
          await new Promise((r) => setTimeout(r, 20));
        }
        return btns.length;
      });
      check(clicked === 31, "All 31 questions scored 2 (" + clicked + ")");
      await admin.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) =>
          b.textContent.includes("Сохранить оценки 1 тура")
        )?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      t = await admin.evaluate(() => document.body.textContent);
      check(t.includes("ПРИНЯТ") || t.includes("принят"), "Rules candidate approved (62 pts)");

      await new Promise((r) => setTimeout(r, 6000));
      await c.reload({ waitUntil: "networkidle0" });
      t = await c.evaluate(() => document.body.textContent);
      check(t.includes("Вы приняты на должность"), "Rules candidate sees result");
    }

    // --- Сценарий 2: билдер (2 тура) ---
    {
      const ctx = await browser.createBrowserContext();
      const c = await ctx.newPage();
      await c.goto(BASE + "/login", { waitUntil: "networkidle0" });
      await c.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) => b.textContent.includes("По ключу"))?.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const login = "bi_" + Date.now();
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
      await admin.goto(BASE + "/admin", { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 5500));
      await admin.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Взять обзвон"))?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      await new Promise((r) => setTimeout(r, 5000));

      // 25×1 = 25 (порог) → 1 тур пройден
      await admin.goto(BASE + "/admin/results", { waitUntil: "networkidle0" });
      await admin.evaluate(() => {
        [...document.querySelectorAll("button[aria-expanded]")][0]?.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
      const clicked = await admin.evaluate(async () => {
        const btns = [...document.querySelectorAll("button")].filter((b) =>
          b.getAttribute("aria-label") === "Оценка 1 балла"
        );
        for (const b of btns) {
          b.click();
          await new Promise((r) => setTimeout(r, 20));
        }
        return btns.length;
      });
      check(clicked === 25, "All 25 questions scored 1 (" + clicked + ")");
      await admin.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) =>
          b.textContent.includes("Сохранить оценки 1 тура")
        )?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));

      await new Promise((r) => setTimeout(r, 6000));
      let t = await c.evaluate(() => document.body.textContent);
      check(t.includes("1 ТУР ПРОЙДЕН"), "Builder sees stage 1 passed");
      check(t.includes("25"), "Score 25 shown");
      await c.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) =>
          b.textContent.includes("Перейти ко 2 туру")
        )?.click();
      });
      await new Promise((r) => setTimeout(r, 4000));
      t = await c.evaluate(() => document.body.textContent);
      check(t.includes("ЗАДАНИЕ 2 ЭТАПА") || t.includes("Задание 2 этапа"), "Practice task shown");
      const timer = await c.evaluate(() => {
        const p = [...document.querySelectorAll("p")].find((x) => /\d{2}:\d{2}:\d{2}/.test(p2(x)));
        function p2(el) { return el.textContent ?? ""; }
        return p?.textContent ?? null;
      });
      check(timer !== null && timer.startsWith("00:5"), "1h timer running: " + timer);

      // 6 критериев × 2 = 12 → принят
      await admin.goto(BASE + "/admin/results", { waitUntil: "networkidle0" });
      await admin.evaluate(() => {
        [...document.querySelectorAll("button[aria-expanded]")][0]?.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
      const crits = await admin.evaluate(async () => {
        const btns = [...document.querySelectorAll("button")].filter((b) =>
          (b.getAttribute("aria-label") ?? "").startsWith("Критерий")
        );
        const twos = btns.filter((b) => b.getAttribute("aria-label")?.includes("2 балла"));
        for (const b of twos) {
          b.click();
          await new Promise((r) => setTimeout(r, 30));
        }
        return twos.length;
      });
      check(crits === 6, "All 6 criteria scored 2 (" + crits + ")");
      await admin.evaluate(() => {
        [...document.querySelectorAll("button")].find((b) =>
          b.textContent.includes("Сохранить оценки 2 тура")
        )?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));
      t = await admin.evaluate(() => document.body.textContent);
      check(t.includes("ПРИНЯТ") || t.includes("принят"), "Builder approved after stage 2");

      await new Promise((r) => setTimeout(r, 6000));
      await c.reload({ waitUntil: "networkidle0" });
      t = await c.evaluate(() => document.body.textContent);
      check(t.includes("Вы приняты на должность"), "Builder sees final result");
    }

    await browser.close();
    console.log(failures === 0 ? "\nINTERVIEW E2E ALL PASS" : `\nFAILURES: ${failures}`);
    process.exit(failures === 0 ? 0 : 1);
  } catch (e) {
    console.error("E2E ERROR:", e.message);
    await browser.close().catch(() => {});
    process.exit(1);
  }
})();
