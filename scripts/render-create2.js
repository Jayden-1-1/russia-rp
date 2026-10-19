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
  await page.goto("https://dashboard.render.com/new?repo=Jayden-1-1%2Frussia-rp", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 5000));
  const selText = await page.evaluate(() => document.body.textContent.slice(0, 400));
  console.log("select page:", selText.slice(0, 200));
  await page.screenshot({ path: "render-select.png" });
  const links = await page.evaluate(() => {
    const els = [...document.querySelectorAll("a, button, div")].filter((el) => el.textContent && el.textContent.includes("russia-rp"));
    if (els.length) { els[0].click(); return true; }
    return false;
  });
  console.log("repo found:", links);
  await new Promise((r) => setTimeout(r, 6000));
  await page.screenshot({ path: "render-repo.png" });
  console.log("after repo URL:", page.url());
  const t2 = await page.evaluate(() => document.body.textContent.slice(0, 600));
  console.log("page2:", t2.slice(0, 400));
  await browser.close();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });