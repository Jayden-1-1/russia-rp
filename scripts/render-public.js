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
  // Перейти на страницу создания сервиса
  await page.goto("https://dashboard.render.com/new", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 6000));
  const t = await page.evaluate(() => document.body.textContent.slice(0, 1500));
  console.log("new page text:", t);
  const inputs = await page.evaluate(() => {
    return [...document.querySelectorAll("input, textarea, select, button")].map((i) => ({ tag: i.tagName, name: i.name, type: i.type, text: (i.textContent || "1").slice(0, 30) }));
  });
  console.log("elements:", JSON.stringify(inputs, null, 1).slice(0, 2500));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button, a")].find((b) => b.textContent.trim() === "New Web Service");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 6000));
  console.log("webservice URL:", page.url());
  const t2 = await page.evaluate(() => document.body.textContent.slice(0, 2000));
  console.log("ws page:", t2.slice(0, 1200));
  const inputs2 = await page.evaluate(() => {
    return [...document.querySelectorAll("input, textarea, select")].map((i) => ({ tag: i.tagName, name: i.name, type: i.type }));
  });
  console.log("ws inputs:", JSON.stringify(inputs2, null, 1).slice(0, 1500));
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll("button, a, [role=tab]")].find((b) => b.textContent.trim().includes("Public Git Repository"));
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
  const inputs3 = await page.evaluate(() => {
    return [...document.querySelectorAll("input, textarea")].map((i) => ({ tag: i.tagName, name: i.name, type: i.type, ph: i.placeholder }));
  });
  console.log("public inputs:", JSON.stringify(inputs3, null, 1).slice(0, 2000));
  const t4 = await page.evaluate(() => document.body.textContent.slice(1500, 3500));
  console.log("public page:", t4.slice(0, 1200));
  await page.screenshot({ path: "render-ws.png" });
  await page.screenshot({ path: "render-new.png" });
  const text = await page.evaluate(() => document.body.textContent.slice(0, 400));
  console.log("text:", text);
  const cookies = await page.cookies();
  fs.writeFileSync("render-cookies.json", JSON.stringify(cookies, null, 1));
  console.log("cookies:", cookies.length);
  await page.screenshot({ path: "render-after-login.png" });
  await browser.close();
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });