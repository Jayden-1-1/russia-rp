const sharp = require("sharp");
(async () => {
  // verify-dino-run.png: canvas is centered. Crop the game canvas area from the page: find via full analysis
  const img = sharp("verify-dino-run.png");
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // Найти самый большой кластер белых пикселей (дина) — ищем по всей картинке
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * ch;
      if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const fill = count / (w * h);
  // Динозавр: компактный кластер. Текст "ВЫ СЕЙЧАС..." тоже белый — ограничим поиск зоной канваса:
  // канвас занимает примерно центр. Ищем кластеры в средней полосе (y 300..600)
  console.log("white bbox:", { minX, minY, maxX, maxY, w, h, count, fill });
})();
