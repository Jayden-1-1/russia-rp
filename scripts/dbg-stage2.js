const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const c = await browser.newPage();
  c.on("response", async (r) => {
    if (r.url().includes("stage2")) {
      try {
        console.log("[stage2-api]", r.url().split("/api/")[1], r.status(), (await r.text()).slice(0, 200));
      } catch {}
    }
  });
  // Логин последним кандидатом s2_*
  await c.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await c.type("#login", process.argv[2]);
  await c.type("#password", "test12345");
  await Promise.all([
    c.waitForNavigation({ waitUntil: "networkidle0" }),
    c.click("button[type=submit]"),
  ]);
  await c.goto("http://localhost:3002/calls", { waitUntil: "networkidle0" });
  const text = await c.evaluate(() => document.body.textContent);
  console.log("calls page has Продолжить:", text.includes("Продолжить"));
  // Зайти в take
  await c.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Продолжить"));
    link?.click();
  });
  await new Promise((r) => setTimeout(r, 4000));
  const t2 = await c.evaluate(() => document.body.textContent);
  console.log("take page stage:", t2.includes("Готов ко 2 туру") ? "stage1 with button" : t2.slice(0, 150));
  // Клик
  await c.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Готов ко 2 туру"))?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  const t3 = await c.evaluate(() => document.body.textContent);
  console.log("after click:", t3.slice(0, 200));
  await browser.close();
})();
