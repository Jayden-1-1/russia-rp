const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const admin = await browser.newPage();
  admin.on("console", (m) => console.log("[page]", m.text().slice(0, 150)));
  admin.on("response", async (r) => {
    if (r.url().includes("/decision")) {
      console.log("[decision]", r.status(), (await r.text()).slice(0, 200));
    }
  });
  await admin.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await admin.type("#login", "admin");
  await admin.type("#password", "admin123");
  await Promise.all([
    admin.waitForNavigation({ waitUntil: "networkidle0" }),
    admin.click("button[type=submit]"),
  ]);
  await admin.goto("http://localhost:3002/admin/results", { waitUntil: "networkidle0" });
  await admin.evaluate(() => {
    [...document.querySelectorAll("button[aria-expanded]")][0]?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  // Кликаем «1» последовательно с задержкой
  const n = await admin.evaluate(async () => {
    const btns = [...document.querySelectorAll("button")].filter((b) =>
      b.getAttribute("aria-label") === "Оценка 1 балл"
    );
    for (const b of btns) {
      b.click();
      await new Promise((r) => setTimeout(r, 30));
    }
    return btns.length;
  });
  await new Promise((r) => setTimeout(r, 800));
  console.log("clicked 1s:", n);
  const saved = await admin.evaluate(async () => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Сохранить и проверить")
    );
    if (!btn) return "no button";
    btn.click();
    await new Promise((r) => setTimeout(r, 4000));
    return "clicked";
  });
  console.log("save:", saved);
  const t = await admin.evaluate(() => document.body.textContent);
  console.log("has auto decision:", t.includes("АВТОМАТИЧЕСКОЕ РЕШЕНИЕ"));
  console.log("has accepted:", t.includes("ПРИНЯТ"));
  await browser.close();
})();
