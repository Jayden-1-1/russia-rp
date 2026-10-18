"use client";

/**
 * Анимированная сетка фона: точки «дышат» — увеличиваются у курсора
 * и плавно уменьшаются обратно. Заменяет статичный CSS-класс bg-grid.
 */

import { useEffect, useRef } from "react";

export default function AnimatedGrid({
  density = 56,
  maxScale = 2.6,
  radius = 140,
}: {
  density?: number;
  maxScale?: number;
  radius?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999 };
    // масштабы точек с инерцией (плавное уменьшение)
    const scales = new Map<string, number>();

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = rect?.width ?? window.innerWidth;
      h = rect?.height ?? window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let t = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      const baseSize = 1;
      for (let gx = density / 2; gx < w; gx += density) {
        for (let gy = density / 2; gy < h; gy += density) {
          const key = gx + ":" + gy;
          const dx = gx - mouse.x;
          const dy = gy - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Целевой масштаб: 1 вдали, maxScale у курсора
          const target =
            dist < radius
              ? 1 + (maxScale - 1) * (1 - dist / radius) * (1 - dist / radius)
              : 1;

          // Инерция: текущий масштаб стремится к целевому
          const cur = scales.get(key) ?? 1;
          const next = cur + (target - cur) * 0.12;
          scales.set(key, next);

          // Базовое лёгкое «дыхание»
          const breathe = 1 + 0.15 * Math.sin(t * 1.4 + gx * 0.05 + gy * 0.03);

          const size = baseSize * next * breathe;
          const alpha = 0.16 + Math.min(0.4, (next - 1) * 0.5);

          const a = "rgba(148,148,158," + alpha.toFixed(3) + ")";
          ctx.fillStyle = a;
          ctx.fillRect(gx - size / 2, gy - size / 2, size, size);
        }
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [density, maxScale, radius]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    />
  );
}
