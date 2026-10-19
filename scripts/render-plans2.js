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
  await page.goto("https://dashboard.render.com/web/new", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll("button, a")].find((b) => b.textContent.trim().includes("Public Git Repository"));
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  const urlInput = await page.$("input[type=text]");
  if (urlInput) {
    await urlInput.click({ clickCount: 3 });
    await urlInput.type("https://github.com/Jayden-1-1/russia-rp");
  }
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Connect");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 6000));
  console.log("form URL:", page.url());
  const planEls = await page.evaluate(() => {
    const els = [...document.querySelectorAll("*")].filter((el) => {
      const t = (el.textContent || "").trim();
      return (t.includes("Free") || t.includes("$0")) && t.length < 100 && el.children.length <= 3;
    });
    return els.map((el) => ({
      tag: el.tagName,
      text: el.textContent.trim().slice(0, 70),
    }));
  });
  console.log("PLAN ELEMENTS:", JSON.stringify(planEls, null, 1).slice(0, 3000));
  const btnsAll = await page.evaluate(() => {
    return [...document.querySelectorAll("button")].map((b) => b.textContent.trim().slice(0, 50)).filter((t) => t.length > 0);
  });
  console.log("ALL BUTTONS:", JSON.stringify(btnsAll));
  const price = await page.evaluate(() => document.body.textContent.slice(-300));
  console.log("PRICE AREA:", price.slice(-200));
  await browser.close();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });