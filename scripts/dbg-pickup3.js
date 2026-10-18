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
  await admin.goto("http://localhost:3002/admin", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 7000));
  const res = await admin.evaluate(async () => {
    const r = await fetch("/api/admin/sessions/pending-pickup");
    const j = await r.json();
    return { status: r.status, ok: j.ok, count: j.data?.pending?.length ?? -1 };
  });
  console.log("direct fetch:", JSON.stringify(res));
  // Сколько всего [role=dialog] и что в HTML от PickupNotifier?
  const html = await admin.evaluate(() => document.body.innerHTML.length);
  console.log("html length:", html);
  await browser.close();
})();
