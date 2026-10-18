const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const admin = await browser.newPage();
  await admin.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await admin.type("#login", "admin");
  await admin.type("#password", "admin123");
  await Promise.all([
    admin.waitForNavigation({ waitUntil: "networkidle0" }),
    admin.click("button[type=submit]"),
  ]);
  // последняя активная сессия и её examiner
  const state = await admin.evaluate(async () => {
    const pending = await fetch("/api/admin/sessions/pending-pickup").then((r) => r.json());
    return pending;
  });
  console.log("pending-pickup:", JSON.stringify(state));
  // active sessions в БД
  const sessions = await admin.evaluate(async () => {
    // нет прямого API — проверим через результат API-запроса к БД из админки нет.
    return null;
  });
  await browser.close();
})();
