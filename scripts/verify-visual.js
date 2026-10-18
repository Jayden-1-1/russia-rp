/**
 * Визуальная проверка через реальный Chrome (puppeteer-core + CDP).
 * Скроллит к 3D-сцене, ждёт загрузки текстуры и рендера, делает скриншот.
 */
const puppeteer = require("puppeteer-core");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3002/#scene", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  await page.waitForFunction(
    () => document.querySelector("canvas") !== null,
    { timeout: 30000 }
  );
  await new Promise((r) => setTimeout(r, 4000));

  const scene = await page.$("#scene");
  if (scene) {
    await scene.screenshot({ path: path.join(__dirname, "..", "verify-scene.png") });
    console.log("verify-scene.png saved");
  }

  await page.goto("http://localhost:3002/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(__dirname, "..", "verify-home.png") });
  console.log("verify-home.png saved");

  const sharp = require("sharp");
  const { data, info } = await sharp(
    path.join(__dirname, "..", "verify-scene.png")
  )
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let white = 0, blue = 0, red = 0;
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 200 && g > 200 && b > 200) white++;
    else if (b > 90 && b > r + 30 && b > g + 30) blue++;
    else if (r > 90 && r > b + 30 && r > g + 30) red++;
  }
  console.log("scene pixels: white=" + white + " blue=" + blue + " red=" + red);
  console.log(
    "TRICOLOR " + (white > 500 && blue > 500 && red > 500 ? "RENDERED OK" : "NOT RENDERED")
  );

  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
