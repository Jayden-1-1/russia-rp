"use client";

/**
 * 3D-сцена с фирменным логотипом Russia RP (оригинальное изображение «R» с триколором).
 *
 * Геометрия: логотип используется как текстура на ЭКСТРУДИРОВАННОЙ 3D-панели
 * (BoxGeometry) — у объекта настоящая толщина, грани, освещение и мягкие тени.
 * Исходное изображение не искажается: оно целиком ложится на лицевую грань.
 * При недоступности WebGL — статичный fallback (исходное изображение).
 *
 * Анимация: плавное появление, медленное вращение вокруг вертикальной оси,
 * ограниченная реакция на курсор с плавным возвратом. prefers-reduced-motion
 * отключает вращение. На мобильных — сниженное качество рендера.
 */

import { useEffect, useRef, useState } from "react";
import type * as ThreeNS from "three";

export default function LogoScene({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    import("three")
      .then((THREE: typeof ThreeNS) => {
        if (disposed) return;

        // WebGL-поддержка
        try {
          const testCanvas = document.createElement("canvas");
          const gl = testCanvas.getContext("webgl2") ?? testCanvas.getContext("webgl");
          if (!gl) throw new Error("no webgl");
        } catch {
          setFailed(true);
          return;
        }

        // Сцена: фон прозрачен — сквозь канвас виден статичный логотип-заглушка,
        // пока не загрузится текстура; фон страницы остаётся единым (#050505)
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x050505, 7, 16);

        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
        camera.position.set(0, 0.35, 8.6);

        let renderer: ThreeNS.WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
        } catch {
          setFailed(true);
          return;
        }
        renderer.setClearColor(0x000000, 0); // прозрачный канвас
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Без тонмаппинга: логотип должен читаться в исходных цветах бренда
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);

        // Освещение: ключевой прожектор с мягкими тенями + заполнение + контровой
        const key = new THREE.SpotLight(0xffffff, 90);
        key.position.set(2.8, 4.5, 4.5);
        key.angle = 0.45;
        key.penumbra = 0.9;
        key.castShadow = true;
        key.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024);
        key.shadow.bias = -0.0005;
        scene.add(key);

        const fill = new THREE.DirectionalLight(0xdfe2ea, 1.4);
        fill.position.set(-3.5, 1.2, 3);
        scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 2.4);
        rim.position.set(-1.5, 3, -4.5);
        scene.add(rim);

        const ambient = new THREE.AmbientLight(0xffffff, 0.45);
        scene.add(ambient);

        // Риг логотипа
        const group = new THREE.Group();
        scene.add(group);

        // Текстура исходного логотипа на лицевую грань экструдированной панели
        const loader = new THREE.TextureLoader();
        loader.load(
          "/logo-cropped.png",
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = isMobile ? 4 : 8;

            // Размер панели 3.2 x 3.2 (логотип квадратный)
            const DEPTH = 0.28; // толщина — настоящий 3D-объём

            // Массив материалов BoxGeometry:
            // 0:+x 1:-x 2:+y 3:-y 4:+z (лицо) 5:-z (тыл)
            const sideMat = new THREE.MeshStandardMaterial({
              color: 0x101013,
              roughness: 0.35,
              metalness: 0.6,
            });
            const faceMat = new THREE.MeshStandardMaterial({
              map: texture,
              transparent: true, // PNG с альфа-каналом: буква без фона
              roughness: 0.82,
              metalness: 0.06,
              // Самоподсветка лица: логотип читается в исходных цветах
              // при любом повороте; объём и тени дают боковое освещение
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.95,
            });

            // Текстура готова: скрываем статичную заглушку под канвасом
            mount.parentElement
              ?.querySelector<HTMLImageElement>("img[aria-hidden]")
              ?.style.setProperty("display", "none");

            // Тыльная грань прозрачна: сквозь букву виден фон страницы,
            // тёмными остаются только боковые рёбра — глубина без «квадрата»
            const backMat = new THREE.MeshStandardMaterial({
              color: 0x050505,
              roughness: 0.9,
              metalness: 0,
              transparent: true,
              opacity: 0.15,
            });
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(3.2, 3.2, DEPTH),
              [sideMat, sideMat, sideMat, sideMat, faceMat, backMat]
            );
            panel.castShadow = true;
            panel.receiveShadow = true;
            group.add(panel);

            // Тонкий кант-только-рёбра: рамка была бы видна сквозь прозрачный логотип,
            // поэтому глубину подчёркивают боковые грани панели и тени
          },
          undefined,
          () => setFailed(true) // не загрузилась текстура → fallback
        );

        // Пол: приёмник мягких теней
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.ShadowMaterial({ opacity: 0.5 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2.3;
        floor.receiveShadow = true;
        scene.add(floor);

        // Появление
        let born = performance.now();
        group.scale.setScalar(0.86);
        group.position.z = -1.6;

        // Реакция на курсор (ограниченная, с плавным возвратом к нулю)
        const target = { x: 0, y: 0 };
        const eased = { x: 0, y: 0 };
        const onPointer = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = (e.clientY / window.innerHeight) * 2 - 1;
          target.x = nx * 0.18;
          target.y = -ny * 0.12;
        };
        window.addEventListener("pointermove", onPointer, { passive: true });

        const resize = () => {
          const w = mount.clientWidth;
          const h = mount.clientHeight;
          if (w === 0 || h === 0) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          const margin = w / h < 0.9 ? 1.55 : 1.0;
          camera.position.z = 7.2 * margin;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(mount);
        resize();

        const clock = new THREE.Clock();
        let raf = 0;
        const animate = () => {
          raf = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();

          // Появление: 1.6s ease-out
          const a = Math.min((performance.now() - born) / 1600, 1);
          const ease = 1 - Math.pow(1 - a, 3);
          group.scale.setScalar(0.86 + 0.14 * ease);
          group.position.z = -1.6 + 1.6 * ease;

          // Маятниковое вращение: логотип никогда не уходит в профиль,
          // буква всегда читается
          if (!prefersReduced) group.rotation.y = Math.sin(t * 0.5) * 0.55;

          // Наклон от курсора поверх вращения, с плавным затуханием
          eased.x += (target.x - eased.x) * 0.045;
          eased.y += (target.y - eased.y) * 0.045;
          group.rotation.x = eased.y;
          group.position.x = eased.x * 0.55;

          renderer.render(scene, camera);
        };
        animate();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          window.removeEventListener("pointermove", onPointer);
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  if (failed) {
    return (
      <div className={className ?? ""}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-cropped.png"
          alt="Логотип Russia RP"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Статичный логотип виден сразу; 3D-канвас рисуется поверх после загрузки Three.js */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-cropped.png"
        alt=""
        aria-hidden
        className="absolute inset-0 m-auto w-2/5 h-2/5 object-contain"
      />
      <div
        ref={mountRef}
        className="absolute inset-0"
        role="img"
        aria-label="Трёхмерная презентация логотипа Russia RP"
      />
    </div>
  );
}
