const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const admin = await browser.newPage();
  admin.on("console", (m) => {
    const t = m.text();
    if (t.includes("error") || t.includes("Error")) console.log("[console]", t.slice(0, 200));
  });
  admin.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
  await admin.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
  await admin.type("#login", "admin");
  await admin.type("#password", "admin123");
  await Promise.all([
    admin.waitForNavigation({ waitUntil: "networkidle0" }),
    admin.click("button[type=submit]"),
  ]);
  await admin.goto("http://localhost:3002/admin", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 6000));
  const info = await admin.evaluate(async () => {
    const res = await fetch("/api/admin/sessions/pending-pickup");
    const json = await res.json();
    const text = document.body.textContent;
    return {
      pending: json.data.pending.length,
      modal: text.includes("Взять обзвон"),
      text: text.slice(0, 300),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
