"use client";

import type { ReactNode } from "react";

/** Внутренняя страница: единый каркас с боковой навигацией. */
export function AppShell({
  nav,
  title,
  track,
  children,
  user,
}: {
  nav: ReactNode;
  title: string;
  track: string;
  children: ReactNode;
  user: { login: string; displayName: string | null; position: string | null };
}) {
  return (
    <div className="min-h-dvh bg-ink bg-grid">
      <div className="mx-auto max-w-[1440px] flex flex-col lg:flex-row">
        {/* Сайдбар */}
        <aside className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-line lg:min-h-dvh sticky top-0 lg:h-dvh bg-panel z-10">
          <div className="p-6 flex items-center justify-between">
            <a href="/cabinet" className="track hover:text-fog transition-colors">MISS RP</a>
          </div>
          <nav className="px-3 pb-6 flex lg:flex-col gap-1 overflow-x-auto">{nav}</nav>
          <div className="hidden lg:block absolute bottom-0 inset-x-0 p-4 border-t border-line">
            <UserBadge user={user} />
          </div>
          {/* Отступ снизу, чтобы контент навигации не наезжал на бейдж */}
          <div className="hidden lg:block h-16" aria-hidden />
        </aside>

        {/* Контент */}
        <main className="flex-1 min-w-0">
          <div className="border-b border-line px-6 sm:px-10 py-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="track">{track}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="lg:hidden"><UserBadge user={user} /></div>
          </div>
          <div className="px-6 sm:px-10 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function UserBadge({
  user,
}: {
  user: { login: string; displayName: string | null; position: string | null };
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-panel-2 border border-line flex items-center justify-center text-xs">
        {(user.displayName ?? user.login).slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="text-sm truncate">{user.displayName ?? user.login}</p>
        <p className="track !text-[9px] !normal-case !tracking-normal text-mist">
          {user.position ?? user.login}
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
      className="track !text-[9px] hover:text-paper transition-colors ml-2"
    >
      ВЫХОД
    </button>
  );
}

export function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        "px-4 py-2.5 text-sm whitespace-nowrap transition-colors " +
        (active ? "bg-panel-2 text-paper" : "text-fog hover:text-paper hover:bg-panel-2")
      }
    >
      {label}
    </a>
  );
}

export function Table({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <table className="w-full border border-line">
      <thead>
        <tr className="bg-panel">
          {head.map((h) => (
            <th key={h} className="track text-left px-4 py-3 !text-[9px]">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line bg-panel">{children}</tbody>
    </table>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-mist">{children}</p>;
}

export function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className={"w-2 h-2 rounded-full " + (ok ? "bg-paper" : "bg-line-strong")}
        aria-hidden
      />
      {label}
    </span>
  );
}
