const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const admin = await browser.newPage();
  admin.on("response", async (r) => {
    if (r.url().includes("pending-pickup") || r.url().includes("stage2-pending")) {
      console.log("[api]", r.url().split("/api/")[1], r.status());
    }
  });
  admin.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 200)));
  await admin.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await admin.type("#login", "admin");
  await admin.type("#password", "admin123");
  await Promise.all([
    admin.waitForNavigation({ waitUntil: "networkidle0" }),
    admin.click("button[type=submit]"),
  ]);
  await admin.goto("http://localhost:3002/admin", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 8000));
  const count = await admin.evaluate(() => ({
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    bodyHasModal: document.body.textContent.includes("КАНДИДАТ ПОДКЛЮЧИЛСЯ"),
  }));
  console.log(JSON.stringify(count));
  await browser.close();
})();
