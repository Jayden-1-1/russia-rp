const sharp = require("sharp");
const path = require("path");

(async () => {
  const src = path.join(__dirname, "..", "screen-2.png");
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let white = 0, blue = 0, red = 0, total = 0;
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    total++;
    if (r > 200 && g > 200 && b > 200) white++;
    else if (b > 100 && b > r + 40 && b > g + 40) blue++;
    else if (r > 100 && r > b + 40 && r > g + 40) red++;
  }
  console.log("total px:", total);
  console.log("white:", white, (white / total * 100).toFixed(2) + "%");
  console.log("blue:", blue, (blue / total * 100).toFixed(2) + "%");
  console.log("red:", red, (red / total * 100).toFixed(2) + "%");
  console.log("tricolor present:", white > 100 && blue > 100 && red > 100);
})().catch((e) => { console.error(e.message); process.exit(1); });
