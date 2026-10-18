const sharp = require("sharp");
(async () => {
  const { data, info } = await sharp("verify-dino-run.png")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // Кластеры: пометим белые пиксели, найдём связный кластер размером > 300 px
  const white = (x, y) => {
    const i = (y * info.width + x) * ch;
    return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200;
  };
  const seen = new Uint8Array(info.width * info.height);
  const clusters = [];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const id = y * info.width + x;
      if (!seen[id] && white(x, y)) {
        // BFS
        const stack = [[x, y]];
        seen[id] = 1;
        let minX = x, maxX = x, minY = y, maxY = y, cnt = 0;
        while (stack.length) {
          const [cx, cy] = stack.pop();
          cnt++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) continue;
            const nid = ny * info.width + nx;
            if (!seen[nid] && white(nx, ny)) {
              seen[nid] = 1;
              stack.push([nx, ny]);
            }
          }
        }
        if (cnt > 300) clusters.push({ minX, minY, maxX, maxY, w: maxX-minX+1, h: maxY-minY+1, cnt });
      }
    }
  }
  clusters.sort((a, b) => b.cnt - a.cnt);
  console.log("top clusters:", JSON.stringify(clusters.slice(0, 5), null, 1));
})();
