/**
 * E2E: вход root-администратора по логину/паролю, проверка админ-панели.
 */
const puppeteer = require("puppeteer-core");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  // 1. Логин
  await page.goto("http://localhost:3002/login", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForSelector("#login", { timeout: 30000 });
  await page.type("#login", "admin");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
    page.click('button[type="submit"]'),
  ]);
  const url = page.url();
  console.log("after login url:", url);
  const inCabinet = url.includes("/cabinet");
  console.log("LOGIN " + (inCabinet ? "OK (redirected to /cabinet)" : "FAILED"));

  // 2. Админ-панель
  await page.goto("http://localhost:3002/admin", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  const content = await page.content();
  const hasOverview = content.includes("Активные обзвоны");
  const hasProfiles = content.includes("Профили");
  const hasKeys = content.includes("Ключи");
  const hasRoles = content.includes("Роли");
  console.log("ADMIN PANEL:", { hasOverview, hasProfiles, hasKeys, hasRoles });

  await page.screenshot({
    path: path.join(__dirname, "..", "verify-admin.png"),
  });

  // 3. Страница логина: скриншот
  await page.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(__dirname, "..", "verify-login.png") });

  await browser.close();
})().catch((e) => {
  console.error("E2E FAIL:", e.message);
  process.exit(1);
});
