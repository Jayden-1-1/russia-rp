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
  // Вводим URL репозитория
  const urlInput = await page.$("input[type=text]");
  if (urlInput) {
    await urlInput.click({ clickCount: 3 });
    await urlInput.type("https://github.com/Jayden-1-1/russia-rp");
    console.log("repo URL typed");
  }
  await new Promise((r) => setTimeout(r, 3000));
  const buttonsAfter = await page.evaluate(() => {
    return [...document.querySelectorAll("button")].map((b) => b.textContent.trim().slice(0, 40)).filter((t) => t.length > 0);
  });
  console.log("buttons:", JSON.stringify(buttonsAfter.slice(0, 20)));
  const inputsAfter = await page.evaluate(() => {
    return [...document.querySelectorAll("input, textarea")].map((i) => ({ tag: i.tagName, name: i.name, type: i.type, ph: i.placeholder, val: (i.value || "").slice(0, 60) }));
  });
  console.log("inputs after:", JSON.stringify(inputsAfter, null, 1).slice(0, 2000));
  // Клик Connect
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Connect");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 8000));
  console.log("after connect URL:", page.url());
  const formInputs = await page.evaluate(() => {
    return [...document.querySelectorAll("input, textarea, select, button")].map((i) => ({ tag: i.tagName, name: i.name, type: i.type, ph: i.placeholder, text: (i.textContent || "").trim().slice(0, 40) }));
  });
  console.log("form elements:", JSON.stringify(formInputs, null, 1).slice(0, 3500));
  await page.type("input[name=serviceName]", "miss-rp");
  await page.evaluate(() => {
    const el = document.querySelector("input[name=buildCommand]");
    if (el) el.value = "";
  });
  await page.type("input[name=buildCommand]", "npm ci && npx prisma generate && npm run build");
  const startEl = await page.$("input[name=startCommand]");
  if (startEl) {
    await startEl.click({ clickCount: 3 });
    await startEl.type("npx prisma migrate deploy && node scripts/prod-init.mjs && npm run start");
  }
  console.log("commands filled");
  // Environment variables: первый слот уже есть (envVars.0)
  const setEnv = async (nameInput, value) => {
  };
  // DATABASE_URL
  const envName = await page.evaluate(() => {
    const el = document.querySelector("input[placeholder=NAME_OF_VARIABLE]");
    return el ? el.value : null;
  });
  console.log("first env name:", envName);
  await page.type('input[placeholder="NAME_OF_VARIABLE"]', "DATABASE_URL");
  const envVal = await page.$("textarea[name="envVars.0.value"]");
  if (envVal) {
    await envVal.type("file:/var/data/miss-rp.db");
  }
  console.log("DATABASE_URL filled");
  await page.screenshot({ path: "render-form.png" });
  await page.screenshot({ path: "render-url.png" });
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