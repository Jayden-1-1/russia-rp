"use client";

/**
 * Всплывающее окно «Взять обзвон» для администрации.
 * Появляется, когда кандидат начал обзвон и ждёт проверяющего.
 * Кнопка «Взять обзвон» присоединяет проверяющего к сессии.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Pending {
  sessionId: string;
  candidate: string;
  category: string;
  startedAt: string;
}

export default function PickupNotifier() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/sessions/pending-pickup");
        const json = await res.json();
        if (alive && json.ok) {
          // показываем только первый (старейший) — без спама
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

  const claim = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/sessions/" + pending.sessionId + "/claim",
        { method: "POST" }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setPending(null);
      // К проверке этого обзвона
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
      aria-label="Кандидат ждёт проверяющего"
    >
      <div className="border border-line bg-panel p-8 max-w-md w-full rise">
        <p className="track mb-4">КАНДИДАТ ПОДКЛЮЧИЛСЯ</p>
        <p className="text-2xl font-semibold tracking-tight mb-2">
          {pending.candidate}
        </p>
        <p className="text-sm text-mist mb-1">
          Направление:{" "}
          {pending.category === "builder" ? "Билдер-скриптер" : "Правила RP"}
        </p>
        <p className="text-xs text-mist leading-relaxed">
          Кандидат начал обзвон и ждёт проверяющего. Возьмите обзвон, чтобы
          присоединиться к беседе и фиксировать ответы.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-fog" role="alert">{error}</p>
        ) : null}
        <div className="mt-8 flex gap-3">
          <button
            onClick={claim}
            disabled={busy}
            className="flex-1 bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)] disabled:opacity-40"
          >
            {busy ? "Подключение…" : "Взять обзвон"}
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
