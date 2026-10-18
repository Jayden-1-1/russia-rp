const sharp = require("sharp");
(async () => {
  const { data, info } = await sharp("dino-canvas.png")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // Связные кластеры белых пикселей
  const white = (x, y) => {
    const i = (y * info.width + x) * ch;
    return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200;
  };
  const seen = new Uint8Array(info.width * info.height);
  const clusters = [];
  const area = (x, y) => y * info.width + x;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (!seen[area(x, y)] && white(x, y)) {
        const stack = [[x, y]];
        seen[area(x, y)] = 1;
        let minX = x, maxX = x, minY = y, maxY = y, cnt = 0;
        while (stack.length) {
          const [cx, cy] = stack.pop();
          cnt++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) continue;
            if (!seen[area(nx, ny)] && white(nx, ny)) {
              seen[area(nx, ny)] = 1;
              stack.push([nx, ny]);
            }
          }
        }
        if (cnt > 150) {
          clusters.push({ minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1, cnt });
        }
      }
    }
  }
  clusters.sort((a, b) => b.cnt - a.cnt);
  for (const c of clusters.slice(0, 6)) {
    console.log(
      "cluster " + c.cnt + "px  " + c.w + "x" + c.h + " at (" + c.minX + "," + c.minY + ")"
    );
  }
})();
