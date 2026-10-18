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
  await admin.goto("http://localhost:3002/admin/results", { waitUntil: "networkidle0" });
  // разворачиваем первую строку
  const expanded = await admin.evaluate(() => {
    const rows = [...document.querySelectorAll("button[aria-expanded]")];
    rows[0]?.click();
    return rows.length;
  });
  await new Promise((r) => setTimeout(r, 1000));
  const info = await admin.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((b) =>
      b.getAttribute("aria-label")?.includes("балл")
    );
    const save = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Сохранить и проверить")
    );
    return {
      rowCount: document.querySelectorAll("button[aria-expanded]").length,
      scoreButtons: btns.length,
      saveButton: Boolean(save),
      firstStatus: document.querySelector("button[aria-expanded]")?.textContent?.slice(0, 80),
    };
  });
  console.log(JSON.stringify({ expanded, info }, null, 1));
  await admin.screenshot({ path: "dbg-results.png" });
  await browser.close();
})();
