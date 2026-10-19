const puppeteer = require("puppeteer-core");
const fs = require("fs");
const cred = JSON.parse(fs.readFileSync("scripts/login-cred.json", "utf8"));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("https://dashboard.render.com/login", { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("input[name=email]", cred.email);
  await page.type("input[name=password]", cred.password);
  await page.click("button[type=submit]");
  await new Promise((r) => setTimeout(r, 8000));
  console.log("URL:", page.url());
  const text = await page.evaluate(() => document.body.textContent.slice(0, 400));
  console.log("text:", text);
  const cookies = await page.cookies();
  fs.writeFileSync("render-cookies.json", JSON.stringify(cookies, null, 1));
  console.log("cookies:", cookies.length);
  await page.screenshot({ path: "render-after-login.png" });
  await page.goto("https://dashboard.render.com/", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 5000));
  const svcText = await page.evaluate(() => document.body.textContent);
  console.log("has miss-rp service:", svcText.includes("miss-rp"));
  console.log("services text:", svcText.slice(300, 1200));
  await browser.close();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });