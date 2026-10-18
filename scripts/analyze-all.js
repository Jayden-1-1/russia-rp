const sharp = require("sharp");
const path = require("path");

(async () => {
  for (const f of ["screen-1.png", "screen-2.png", "screen-3.png"]) {
    const { data, info } = await sharp(path.join(__dirname, "..", f))
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
    console.log(f, "white:" + white, "blue:" + blue, "red:" + red);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
