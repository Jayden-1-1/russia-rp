"use client";

/**
 * Всплывающее окно «Кандидат готов ко 2 туру» для проводящих.
 * Появляется, когда билдер-скриптер нажал «Готов ко 2 туру».
 * Кнопка запускает практику: случайное задание + таймер 1 час.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Pending {
  sessionId: string;
  candidate: string;
  category: string;
  readyAt: string;
}

export default function Stage2Notifier() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/sessions/stage2-pending");
        const json = await res.json();
        if (alive && json.ok) {
          setPending(json.data.pending[0] ?? null);
        }
      } catch {
        // сеть — молча
      }
    };
    const t = setInterval(poll, 4000);
    poll();
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const start = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/sessions/" + pending.sessionId + "/stage2-start",
        { method: "POST" }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setPending(null);
      router.push("/admin/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  if (!pending) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Кандидат готов ко 2 туру"
    >
      <div className="border border-line bg-panel p-8 max-w-md w-full rise">
        <p className="track mb-4">КАНДИДАТ ГОТОВ КО 2 ТУРУ</p>
        <p className="text-2xl font-semibold tracking-tight mb-2">
          {pending.candidate}
        </p>
        <p className="text-sm text-mist mb-1">
          Направление: Билдер-скриптер
        </p>
        <p className="text-xs text-mist leading-relaxed">
          Кандидат завершил устную часть и готов к практике. Запустите 2 этап:
          случайное задание из трёх + таймер 1 час. Кандидат увидит задание
          и таймер сразу после запуска.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-fog" role="alert">{error}</p>
        ) : null}
        <div className="mt-8 flex gap-3">
          <button
            onClick={start}
            disabled={busy}
            className="flex-1 bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)] disabled:opacity-40"
          >
            {busy ? "Запуск…" : "Запустить 2 этап"}
          </button>
          <button
            onClick={() => setPending(null)}
            disabled={busy}
            className="flex-1 border border-line px-6 py-3 text-sm text-fog hover:border-line-strong hover:text-paper transition-all duration-200 disabled:opacity-40"
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}
