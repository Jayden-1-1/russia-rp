const sharp = require("sharp");
const path = require("path");

(async () => {
  const src = path.join(__dirname, "..", "shot-full.png");
  const meta = await sharp(src).metadata();
  const h = meta.height;
  const third = Math.round(h / 3);
  for (let i = 0; i < 3; i++) {
    await sharp(src)
      .extract({ left: 0, top: i * third, width: meta.width, height: third })
      .png()
      .toFile(path.join(__dirname, "..", `screen-${i + 1}.png`));
  }
  console.log("sliced into 3 screens");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
