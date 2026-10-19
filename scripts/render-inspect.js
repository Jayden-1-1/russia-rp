const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("https://dashboard.render.com/login", { waitUntil: "networkidle2", timeout: 60000 });
  console.log("URL:", page.url());
  const inputs = await page.evaluate(() => {
    return [...document.querySelectorAll("input")].map((i) => ({
      id: i.id, name: i.name, type: i.type, placeholder: i.placeholder,
    }));
  });
  console.log("inputs:", JSON.stringify(inputs, null, 1));
  const buttons = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent.trim().slice(0, 40)));
  console.log("buttons:", JSON.stringify(buttons));
  await page.screenshot({ path: "render-login.png" });
  await browser.close();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });