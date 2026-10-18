const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const p = await browser.newPage();
  await p.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await p.type("#login", "admin");
  await p.type("#password", "admin123");
  await Promise.all([
    p.waitForNavigation({ waitUntil: "networkidle0" }),
    p.click("button[type=submit]"),
  ]);
  await p.goto("http://localhost:3002/calls", { waitUntil: "networkidle0" });
  console.log("URL:", p.url());
  const t = await p.evaluate(() => document.body.textContent.slice(0, 800));
  console.log("TEXT:", t);
  await browser.close();
})();
