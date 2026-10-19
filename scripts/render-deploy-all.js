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
  // Ждём поле публичного репозитория
  let urlInput = null;
  for (let tries = 0; tries < 25; tries++) {
    urlInput = await page.$("input[placeholder^=\"https://github.com\"]");
    if (urlInput) break;
    await page.evaluate(() => {
      const tab = [...document.querySelectorAll("button, a, [role=tab]")].find((b) => b.textContent.trim().includes("Public Git Repository"));
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (urlInput) {
    await urlInput.click({ clickCount: 3 });
    await urlInput.type("https://github.com/Jayden-1-1/russia-rp");
    console.log("repo URL typed");
  } else {
    console.log("URL FIELD NOT FOUND");
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
  await new Promise((r) => setTimeout(r, 6000));
  const emailField = await page.$("input[name=email]");
  if (page.url().includes("/login") || emailField !== null) {
    console.log("SESSION LOST - relogin");
    await page.type("input[name=email]", cred.email);
    await page.type("input[name=password]", cred.password);
    await page.click("button[type=submit]");
    await new Promise((r) => setTimeout(r, 8000));
    await page.goto("https://dashboard.render.com/web/new", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4000));
    // Переключаемся на вкладку Public Git Repository и ждём поле URL
    let urlField = null;
    for (let tries = 0; tries < 10; tries++) {
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll("button, a")].find((b) => b.textContent.trim().includes("Public Git Repository"));
        if (tab) tab.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
      urlField = await page.$('input[placeholder^="https://github.com"]');
      if (urlField) break;
    }
    if (urlField) {
      await urlField.click({ clickCount: 3 });
      await urlField.type("https://github.com/Jayden-1-1/russia-rp");
      console.log("relogin: repo URL typed");
    } else {
      console.log("relogin: URL field NOT found");
    }
    await new Promise((r) => setTimeout(r, 3000));
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Connect");
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 8000));
  }
  console.log("after connect URL:", page.url());
  await new Promise((r) => setTimeout(r, 5000));
  const svcField = await page.$("input[name=serviceName]");
  console.log("serviceName present:", svcField !== null);
  if (!svcField) {
    await new Promise((r) => setTimeout(r, 10000));
  }
  const formInputs = await page.evaluate(() => {
    return [...document.querySelectorAll("input, textarea, select, button")].map((i) => ({ tag: i.tagName, name: i.name, type: i.type, ph: i.placeholder, text: (i.textContent || "").trim().slice(0, 40) }));
  });
  console.log("form elements:", JSON.stringify(formInputs, null, 1).slice(0, 3500));
  const clearAndType = async (el, text) => {
    await el.evaluate((node) => {
      const proto = node.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(node, "");
      node.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await el.type(text);
  };
  const nameEl = await page.$("input[name=serviceName]");
  if (nameEl) await clearAndType(nameEl, "miss-rp");
  const buildEl = await page.$("input[name=buildCommand]");
  if (buildEl) await clearAndType(buildEl, "npm ci && npx prisma generate && npm run build");
  const startEl = await page.$("input[name=startCommand]");
  if (startEl) await clearAndType(startEl, "npx prisma migrate deploy && node scripts/prod-init.mjs && npm run start");
  console.log("commands filled");
  // Переменные окружения (очистка + позиция)
  const typeEnvByIndex = async (slot, name, value) => {
    const nameInputs = await page.$$("input[placeholder=NAME_OF_VARIABLE]");
    const valAreas = await page.$$("textarea");
    const ni = nameInputs[slot];
    const va = valAreas[slot];
    if (ni && va) {
      await clearAndType(ni, name);
      await clearAndType(va, value);
    } else {
      console.log("slot " + slot + " missing");
    }
  };
  await typeEnvByIndex(0, "DATABASE_URL", "file:/var/data/miss-rp.db");
  console.log("env1 done");
  const addVar = async () => {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Add Environment Variable"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
  };
  await addVar();
  await typeEnvByIndex(1, "SESSION_SECRET", "bK3n74BaQI32L5XYccgW0MiiwIX4w7");
  console.log("env2 done");
  await addVar();
  await typeEnvByIndex(2, "ROOT_LOGIN", "admin");
  console.log("env3 done");
  await addVar();
  await typeEnvByIndex(3, "ROOT_PASSWORD", "admin123");
  console.log("env4 done");
  let freeOk = false;
  for (let tries = 0; tries < 15 && !freeOk; tries++) {
    freeOk = await page.evaluate(() => {
      const show = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Show all"));
      if (show) show.click();
      const els = [...document.querySelectorAll("button, [role=button], label, div, li")];
      const freeBtn = els.find((el) => {
        const t = el.textContent.trim();
        return t.includes("0.1 CPU") && t.length < 100 && el.children.length < 6;
      });
      if (freeBtn) { freeBtn.click(); return true; }
      return false;
    });
    if (!freeOk) await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("free clicked:", freeOk);
  await new Promise((r) => setTimeout(r, 2000));
  await new Promise((r) => setTimeout(r, 2000));
  // ДЕПЛОЙ — ждём активацию кнопки
  let deployed = false;
  for (let tries = 0; tries < 25 && !deployed; tries++) {
    const btnInfo = await page.evaluate(() => {
      const all = [...document.querySelectorAll("button")];
      const btn = all.find((b) => b.textContent.includes("Deploy web service"));
      return btn ? { disabled: btn.disabled, idx: all.indexOf(btn) } : null;
    });
    if (btnInfo && !btnInfo.disabled) {
      const btns = await page.$$(
"button"
);
      if (btns[btnInfo.idx]) {
        await btns[btnInfo.idx].click();
        deployed = true;
      }
    } else {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log("deploy click sent:", deployed);
  const allState = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll("input, textarea")].map((i) => ({ name: i.name, ph: i.placeholder.slice(0, 30), val: (i.value || "").slice(0, 50) }));
    const errs = [...document.querySelectorAll("[class*=rror]")].map((e) => e.textContent.trim().slice(0, 120)).filter((t) => t.length > 5);
    return { inputs, errs };
  });
  console.log("STATE:", JSON.stringify(allState, null, 1).slice(0, 3500));
  const btnState = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Deploy web service"));
    if (!btn) return null;
    return { disabled: btn.disabled };
  });
  console.log("deploy btn:", JSON.stringify(btnState));
  await new Promise((r) => setTimeout(r, 5000));
  const errs = await page.evaluate(() => {
    const els = [...document.querySelectorAll("[role=alert], .error")];
    return els.map((e) => e.textContent.trim().slice(0, 150)).filter((t) => t.length > 3);
  });
  console.log("FORM ERRORS:", JSON.stringify(errs));
  const bodyAll = await page.evaluate(() => document.body.textContent);
  const di = bodyAll.indexOf("Deploy web service");
  console.log("around deploy:", bodyAll.slice(Math.max(0, di - 300), di + 200));
  await new Promise((r) => setTimeout(r, 60000));
  console.log("deploy URL:", page.url());
  await page.screenshot({ path: "render-deploying.png" });
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