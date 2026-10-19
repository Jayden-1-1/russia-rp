"use client";

/**
 * Аватар проекта: логотип MISS RP в круге с мягким перетеканием
 * цветов (золото → тёплый оттенок → белый) по краю.
 */

export default function Avatar({ size = 64 }: { size?: number }) {
  return (
    <div
      className="relative rounded-full p-[3px] shrink-0"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, rgba(212,175,55,0.9) 0%, rgba(212,175,55,0.25) 35%, rgba(255,255,255,0.9) 100%)",
        animation: "avatar-glow 5s ease-in-out infinite",
      }}
    >
      <div className="w-full h-full rounded-full bg-ink flex items-center justify-center overflow-hidden">
        <img
          src="/logo-miss.png"
          alt="MISS RP"
          className="w-[82%] h-[82%] object-contain"
        />
      </div>
    </div>
  );
}