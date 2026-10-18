/**
 * Динозавр — спрайт пользователя (перекрашенный в белый), рисуется на канвас.
 * Загружается один раз и кэшируется; масштабируется под высоту игры.
 * Бег: лёгкое покачивание (up/down) — спрайт цельный.
 */

let cachedImage: HTMLImageElement | null = null;
let loading = false;

function getSprite(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (cachedImage) return cachedImage.complete && cachedImage.naturalWidth > 0 ? cachedImage : null;
  if (!loading) {
    loading = true;
    const img = new Image();
    img.src = "/dino-white.png";
    img.onload = () => {
      cachedImage = img;
    };
  }
  return null;
}

/**
 * Рисует динозавра: x — левый край, groundY — линия земли (ноги).
 * running — анимация бега (лёгкое покачивание).
 * Возвращает фактические размеры нарисованного спрайта (для хитбокса).
 */
export function drawTrex(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  running: boolean,
  frame: number
): { w: number; h: number } {
  const TARGET_H = 60; // высота фигуры на канвасе
  const img = getSprite();

  // Бег: покачивание вверх-вниз на 2px
  const bob = running ? Math.round(Math.sin(frame / 6) * 2) : 0;

  if (img) {
    const scale = TARGET_H / img.naturalHeight;
    const w = img.naturalWidth * scale;
    // Спрайт с прозрачными полями — центрируем по земле
    ctx.drawImage(img, x, groundY - TARGET_H + bob, w, TARGET_H);
    return { w, h: TARGET_H };
  }

  // Фолбэк, пока спрайт грузится: простой силуэт
  ctx.fillStyle = "#f4f4f6";
  const w = 48;
  const h = TARGET_H;
  ctx.fillRect(x + 8, groundY - h + bob, w - 16, h - 18);
  ctx.fillRect(x + w - 22, groundY - h + bob, 22, 24);
  ctx.fillRect(x, groundY - h + 24 + bob, 12, 12);
  ctx.fillRect(x + 10, groundY - 18 + bob, 8, 18);
  ctx.fillRect(x + 24, groundY - 18 + bob, 8, 18);
  return { w, h };
}
