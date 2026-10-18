const sharp = require("sharp");
const path = require("path");

(async () => {
  const src = path.join(__dirname, "..", "public", "logo.png");
  const dst = path.join(__dirname, "..", "public", "logo-cropped.png");

  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Bounding box по альфа-каналу (непрозрачные пиксели)
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  const ch = info.channels;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * ch + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  console.log("bbox:", minX, minY, bw, bh);

  // Квадрат с паддингом, в границах изображения
  const pad = Math.round(Math.max(bw, bh) * 0.06);
  const side = Math.min(Math.max(bw, bh) + pad * 2, info.width, info.height);
  let left = Math.round(minX - (side - bw) / 2);
  let top = Math.round(minY - (side - bh) / 2);
  left = Math.max(0, Math.min(left, info.width - side));
  top = Math.max(0, Math.min(top, info.height - side));

  await sharp(src)
    .extract({ left, top, width: side, height: side })
    .png()
    .toFile(dst);
  console.log("saved logo-cropped.png", side + "x" + side);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
