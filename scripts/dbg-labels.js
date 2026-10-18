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
  await admin.goto("http://localhost:3002/admin/results", { waitUntil: "networkidle0" });
  await admin.evaluate(() => {
    [...document.querySelectorAll("button[aria-expanded]")][0]?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const labels = await admin.evaluate(() => {
    const btns = [...document.querySelectorAll("button[aria-label]")];
    return btns.slice(0, 6).map((b) => b.getAttribute("aria-label"));
  });
  console.log("aria-labels sample:", JSON.stringify(labels));
  await browser.close();
})();
