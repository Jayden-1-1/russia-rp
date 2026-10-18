import Link from "next/link";
import LogoScene from "@/components/LogoScene";
import Greeting from "@/components/Greeting";
import AnimatedGrid from "@/components/AnimatedGrid";

export default function Home() {
  return (
    <main className="relative bg-ink overflow-x-clip">
      {/* ===== Экран 1: Приветствие ===== */}
      <section
        id="hero"
        className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Фон: анимированная сетка (точки реагируют на курсор) */}
        <AnimatedGrid aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(255,255,255,0.05),transparent)]"
          aria-hidden
        />

        {/* Верхняя техническая строка */}
        <header className="absolute top-0 inset-x-0 flex items-center justify-between px-6 sm:px-10 py-6 z-10">
          <span className="track rise">RUSSIA RP</span>
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#auth" className="track hover:text-fog transition-colors">Вход</a>
            <Link href="/login" className="track hover:text-fog transition-colors">Ключ</Link>
          </nav>
          <span className="track hidden sm:inline rise">EST. 2026</span>
        </header>

        {/* Центр: крупное приветствие */}
        <div className="relative z-10 text-center px-6">
          <div className="rise">
            <Greeting />
          </div>
          <h1
            className="mt-6 text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.02] text-paper rise"
            style={{ animationDelay: "120ms" }}
          >
            RUSSIA RP
          </h1>
          <p
            className="mt-6 track !text-xs sm:!text-sm tracking-[0.5em] text-mist rise"
            style={{ animationDelay: "240ms" }}
          >
            DIGITAL EXPERIENCE
          </p>
          <p
            className="mt-8 max-w-md mx-auto text-fog text-sm leading-relaxed rise"
            style={{ animationDelay: "360ms" }}
          >
            Цифровое пространство проекта — авторизация, обзвоны и управление в одном месте.
          </p>
          <a
            href="#auth"
            className="mt-10 inline-block rise border border-line-strong px-8 py-4 text-sm font-medium text-paper hover:bg-paper hover:text-ink transition-all duration-300"
            style={{ animationDelay: "480ms" }}
          >
            Войти в проект
          </a>
        </div>

        {/* Подсказка прокрутки */}
        <a
          href="#scene"
          aria-label="Прокрутить к 3D-логотипу"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-mist hover:text-paper transition-colors z-10"
        >
          <span className="track">Скролл</span>
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="bob" aria-hidden>
            <path d="M7 1v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </a>
      </section>

      {/* ===== Экран 2: 3D-логотип ===== */}
      <section
        id="scene"
        className="relative min-h-dvh flex items-center justify-center overflow-hidden scroll-mt-0"
      >
        {/* 3D-сцена */}
        <div className="absolute inset-0">
          <LogoScene className="w-full h-full" />
        </div>

        {/* Подпись под логотипом */}
        <div className="absolute bottom-24 sm:bottom-28 inset-x-0 flex flex-col items-center gap-2 z-10 pointer-events-none">
          <div className="w-16 h-px bg-line-strong mb-2" aria-hidden />
          <p className="text-sm tracking-[0.45em] text-paper/90 font-semibold">
            RUSSIA RP
          </p>
          <p className="track">DIGITAL EXPERIENCE</p>
        </div>

        {/* Номер секции */}
        <span className="absolute top-6 right-6 sm:right-10 track z-10">02 / Логотип</span>

        {/* Подсказка прокрутки */}
        <a
          href="#auth"
          aria-label="Прокрутить к авторизации"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-mist hover:text-paper transition-colors z-10"
        >
          <span className="track">Далее</span>
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="bob" aria-hidden>
            <path d="M7 1v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </a>
      </section>

      {/* ===== Экран 3: Авторизация ===== */}
      <section id="auth" className="relative border-t border-line scroll-mt-0">
        <AnimatedGrid aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 py-24 sm:py-32 min-h-[70vh] flex items-center">
          <div className="grid sm:grid-cols-[1fr_auto] gap-12 sm:gap-20 items-end w-full">
            <div className="rise">
              <p className="track">03 — Идентификация</p>
              <h2 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
                Войти в Russia RP
              </h2>
              <p className="mt-5 max-w-md text-mist leading-relaxed">
                Вход по личному логину и паролю. Аккаунты и ключи-приглашения
                выдаёт администрация проекта.
              </p>
            </div>
            <div className="rise" style={{ animationDelay: "120ms" }}>
              <a
                href="/login"
                className="group inline-flex items-center gap-4 bg-paper text-ink px-8 py-5 text-sm font-medium tracking-wide hover:bg-fog transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)]"
              >
                <span>Войти по логину и паролю</span>
                <span className="track !text-ink/50 group-hover:!text-ink/70 transition-all group-hover:translate-x-1 duration-300">→</span>
              </a>
              <p className="track mt-4 !normal-case !tracking-normal text-xs">
                Есть ключ-приглашение? Активируйте его на странице входа.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Технический низ ===== */}
      <footer className="border-t border-line relative">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-10 flex flex-wrap gap-6 justify-between">
          <span className="track">RUSSIA RP — DIGITAL EXPERIENCE</span>
          <span className="track">© 2026</span>
        </div>
      </footer>
    </main>
  );
}
