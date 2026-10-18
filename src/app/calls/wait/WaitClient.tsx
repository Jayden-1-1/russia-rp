"use client";

/**
 * Страница ожидания своего обзвона.
 * Кандидат видит «Ожидайте своего обзвона», а когда администратор назначит
 * обзвон — появляется кнопка «Начать обзвон». Только по нажатию обзвон стартует.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Assignment {
  assignmentId: string;
  active: boolean;
}

export default function WaitClient({ initial }: { initial: Assignment | null }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(initial);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Опрос: администратор может назначить обзвон в любой момент
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/calls/waiting");
        const json = await res.json();
        if (alive && json.ok) setAssignment(json.data.assignment);
      } catch {
        // сеть недоступна — пробуем снова на следующем тике
      }
    };
    const t = setInterval(poll, 5000);
    poll();
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const begin = async () => {
    if (!assignment) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/calls/${assignment.assignmentId}/start`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Не удалось начать");
      router.push(`/calls/take/${assignment.assignmentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setStarting(false);
    }
  };

  return (
    <div className="border border-line bg-panel p-10 text-center max-w-lg rise">
      {assignment ? (
        <>
          <p className="track mb-4">ОБЗВОН НАЗНАЧЕН</p>
          <p className="text-2xl font-semibold tracking-tight mb-3">Вас ждут на обзвоне</p>
          <p className="text-mist text-sm leading-relaxed mb-8">
            Нажмите «Начать обзвон», когда будете готовы. Проверяющий подключится к беседе.
          </p>
          <button
            onClick={begin}
            disabled={starting}
            className="bg-paper text-ink px-8 py-4 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)] disabled:opacity-40"
          >
            {starting ? "Начало…" : "Начать обзвон"}
          </button>
          {error ? <p className="mt-4 text-sm text-fog">{error}</p> : null}
        </>
      ) : (
        <>
          <p className="track mb-4">ОЖИДАНИЕ</p>
          <p className="text-2xl font-semibold tracking-tight mb-3">Ожидайте своего обзвона</p>
          <p className="text-mist text-sm leading-relaxed">
            Ваш ключ активирован. Как только администрация назначит обзвон, здесь
            появится кнопка начала — страница обновляется автоматически.
          </p>
          <span className="inline-flex items-center gap-3 mt-8 text-mist text-xs">
            <span
              className="w-1.5 h-1.5 rounded-full bg-fog"
              style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }}
              aria-hidden
            />
            Проверяем статус…
          </span>
        </>
      )}
    </div>
  );
}
