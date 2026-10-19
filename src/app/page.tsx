import Link from "next/link";
import LogoScene from "@/components/LogoScene";
import Greeting from "@/components/Greeting";
import AnimatedGrid from "@/components/AnimatedGrid";

const FEATURES = [
  { title: "Обзвоны", desc: "Устные собеседования с оценками в реальном времени" },
  { title: "Практика", desc: "Задания по Roblox Studio для билдеров-скриптеров" },
  { title: "Роли", desc: "Ключи-приглашения и матрица доступа администрации" },
];

export default function Home() {
  return (
    <main className="relative bg-ink overflow-x-clip">
      {/* ===== Экран 1: Приветствие ===== */}
      <section
        id="hero"
        className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden"
      >
        <AnimatedGrid aria-hidden />
        {/* Мягкий золотой ореол, медленно дрейфует */}
        <div
          className="absolute left-1/2 top-16 w-[70vw] h-[70vw] max-w-[640px] max-h-[640px] rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0.05) 45%, transparent 70%)",
            animation: "halo-drift 9s ease-in-out infinite",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(255,255,255,0.05),transparent)]"
          aria-hidden
        />

        {/* Верхняя техническая строка */}
        <header className="absolute top-0 inset-x-0 flex items-center justify-between px-6 sm:px-10 py-6 z-10">
          <span className="track rise">MISS RP</span>
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#features" className="track hover:text-fog transition-colors">О проекте</a>
            <a href="#auth" className="track hover:text-fog transition-colors">Вход</a>
            <Link href="/login" className="track hover:text-fog transition-colors">Ключ</Link>
          </nav>
          <span className="track hidden sm:inline rise">EST. 2026</span>
        </header>

        {/* Центр: логотип + приветствие */}
        <div className="relative z-10 text-center px-6">
          <div className="rise mx-auto mb-8 w-32 h-32 sm:w-40 sm:h-40 relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_70%)]"
              aria-hidden
            />
            <img
              src="/logo-miss.png"
              alt="Логотип MISS RP"
              className="relative w-full h-full object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              style={{ animation: "logo-glow 4s ease-in-out infinite" }}
            />
          </div>
          <div className="rise" style={{ animationDelay: "120ms" }}>
            <Greeting />
          </div>
          <h1
            className="mt-6 text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.02] rise"
            style={{ animationDelay: "200ms" }}
          >
            MISS RP
          </h1>
          <p
            className="mt-6 track !text-xs sm:!text-sm tracking-[0.5em] text-mist rise"
            style={{ animationDelay: "320ms" }}
          >
            DIGITAL EXPERIENCE
          </p>
          <p
            className="mt-8 max-w-md mx-auto text-fog text-sm leading-relaxed rise"
            style={{ animationDelay: "420ms" }}
          >
            Мы — начинающий проект в Roblox по РП России. Проходим путь
            от кандидата до полноценной роли в структуре: собеседования,
            обзвоны и практика для билдеров-скриптеров.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center rise" style={{ animationDelay: "520ms" }}>
            <a
              href="#auth"
              className="bg-paper text-ink px-8 py-4 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)]"
            >
              Войти в проект
            </a>
            <a
              href="#features"
              className="border border-line-strong px-8 py-4 text-sm font-medium text-paper hover:bg-paper/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              Что внутри
            </a>
          </div>
        </div>

        {/* Подсказка прокрутки */}
        <a
          href="#features"
          aria-label="Прокрутить к преимуществам"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-mist hover:text-paper transition-colors z-10"
        >
          <span className="track">Скролл</span>
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="bob" aria-hidden>
            <path d="M7 1v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </a>
      </section>

      {/* ===== Экран 2: Преимущества ===== */}
      <section id="features" className="relative border-t border-line scroll-mt-0">
        <AnimatedGrid aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 py-24">
          <p className="track">02 — Возможности</p>
          <h2 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight rise">
            Внутри проекта
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="border border-line bg-panel p-6 hover:border-line-strong hover:-translate-y-1 transition-all duration-300"
                style={{ animation: "feature-in 0.7s ease-out both", animationDelay: 120 * (i + 1) + "ms" }}
              >
                <p className="track !text-[9px]">0{i + 1}</p>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-mist leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Экран 3: 3D-логотип ===== */}
      <section
        id="scene"
        className="relative min-h-dvh flex items-center justify-center overflow-hidden scroll-mt-0"
      >
        <div className="absolute inset-0">
          <LogoScene className="w-full h-full" />
        </div>

        <div className="absolute bottom-24 sm:bottom-28 inset-x-0 flex flex-col items-center gap-2 z-10 pointer-events-none">
          <div className="w-16 h-px bg-line-strong mb-2" aria-hidden />
          <p className="text-sm tracking-[0.45em] text-paper/90 font-semibold">
            MISS RP
          </p>
          <p className="track">DIGITAL EXPERIENCE</p>
        </div>

        <span className="absolute top-6 right-6 sm:right-10 track z-10">03 / Логотип</span>

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

      {/* ===== Экран 4: Авторизация ===== */}
      <section id="auth" className="relative border-t border-line scroll-mt-0">
        <AnimatedGrid aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 py-24 sm:py-32 min-h-[70vh] flex items-center">
          <div className="grid sm:grid-cols-[1fr_auto] gap-12 sm:gap-20 items-end w-full">
            <div className="rise">
              <p className="track">04 — Идентификация</p>
              <h2 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
                Войти в MISS RP
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
          <span className="track">MISS RP — DIGITAL EXPERIENCE</span>
          <span className="track">© 2026</span>
        </div>
      </footer>
    </main>
  );
}