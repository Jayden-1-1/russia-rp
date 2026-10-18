"use client";

/**
 * Кандидаты: список профилей.
 * Назначение обзвона: выбор направления → подтверждающее окно →
 * вариант выбирается случайно (имя скрыто ото всех).
 */

import { useState } from "react";
import { Empty } from "@/components/ui";

interface Assignment {
  id: string;
  category: string;
  status: string;
  sessionStatus: string | null;
}

interface Candidate {
  id: string;
  login: string;
  displayName: string | null;
  roles: string[];
  assignments: Assignment[];
  lastSeen: string;
}

export default function CandidatesClient({ candidates }: { candidates: Candidate[] }) {
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [confirming, setConfirming] = useState<{ category: "rules" | "builder"; candidate: Candidate } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assign = async () => {
    if (!confirming) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: confirming.candidate.id, category: confirming.category }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(
        `Обзвон назначен: ${confirming.candidate.displayName ?? confirming.candidate.login} — ${
          confirming.category === "builder" ? "билдер-скриптер" : "правила RP"
        }. Вариант выбран случайно.`
      );
      setConfirming(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  if (!candidates.length) {
    return <Empty>Профилей пока нет. Создайте их в «Профили» или выдайте ключ-приглашение.</Empty>;
  }

  return (
    <div>
      {error ? (
        <p className="mb-6 text-sm border border-line-strong bg-panel px-4 py-3" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-6 text-sm text-paper border border-line bg-panel px-4 py-3 rise">{message}</p>
      ) : null}

      <div className="space-y-px bg-line border border-line">
        {candidates.map((c) => {
          const open = selected?.id === c.id;
          return (
            <div key={c.id} className="bg-panel">
              <button
                onClick={() => setSelected(open ? null : c)}
                aria-expanded={open}
                className="w-full flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-4 text-left hover:bg-panel-2 transition-colors"
              >
                <span className="text-sm">{c.displayName ?? c.login}</span>
                <span className="track !text-[9px] !normal-case !tracking-normal">
                  {c.roles.join(" · ") || "без роли"}
                </span>
                {c.assignments.some((a) => a.status === "assigned") ? (
                  <span className="track !text-[9px] text-fog">ЕСТЬ НАЗНАЧЕНИЕ</span>
                ) : null}
                <span className="track !text-[9px] ml-auto">
                  {new Date(c.lastSeen).toLocaleDateString("ru-RU")}
                </span>
              </button>

              {open ? (
                <div className="px-5 pb-6 border-t border-line pt-5">
                  {c.assignments.length ? (
                    <div className="mb-5 space-y-1">
                      <p className="track mb-2 !text-[9px]">НАЗНАЧЕНИЯ</p>
                      {c.assignments.map((a) => (
                        <p key={a.id} className="text-xs text-fog">
                          {a.category === "builder" ? "Билдер-скриптер" : "Правила RP"} —{" "}
                          {a.status === "completed"
                            ? "завершён"
                            : a.sessionStatus === "active"
                              ? "идёт"
                              : "ожидает"}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <p className="track mb-3 !text-[9px]">Назначить обзвон</p>
                  <div className="grid sm:grid-cols-2 gap-px border border-line">
                    <button
                      onClick={() => setConfirming({ category: "rules", candidate: c })}
                      className="bg-ink hover:bg-panel-2 px-4 py-5 text-left transition-all duration-200 group"
                    >
                      <span className="text-sm group-hover:text-paper transition-colors">
                        Правила RP
                      </span>
                      <span className="block text-xs text-mist mt-1">
                        3 варианта · случайный выбор
                      </span>
                    </button>
                    <button
                      onClick={() => setConfirming({ category: "builder", candidate: c })}
                      className="bg-ink hover:bg-panel-2 px-4 py-5 text-left transition-all duration-200 group"
                    >
                      <span className="text-sm group-hover:text-paper transition-colors">
                        Билдер-скриптер
                      </span>
                      <span className="block text-xs text-mist mt-1">
                        3 варианта · случайный выбор
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Подтверждение назначения */}
      {confirming ? (
        <div
          className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Подтверждение назначения обзвона"
          onClick={() => !busy && setConfirming(null)}
        >
          <div
            className="border border-line bg-panel p-8 max-w-md w-full rise"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="track mb-4">НАЗНАЧИТЬ ОБЗВОН</p>
            <p className="text-lg font-semibold tracking-tight">
              {confirming.category === "builder" ? "Билдер-скриптер" : "Правила RP"}
            </p>
            <p className="text-sm text-mist mt-2">
              Кандидат: {confirming.candidate.displayName ?? confirming.candidate.login}
            </p>
            <p className="text-xs text-fog leading-relaxed mt-4">
              Вариант из трёх выберется случайно — даже вы не узнаете, какой достанется.
              После подтверждения у кандидата появится кнопка «Начать обзвон».
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={assign}
                disabled={busy}
                className="flex-1 bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40"
              >
                {busy ? "Назначение…" : "Подтвердить"}
              </button>
              <button
                onClick={() => setConfirming(null)}
                disabled={busy}
                className="flex-1 border border-line px-6 py-3 text-sm text-fog hover:border-line-strong hover:text-paper transition-all duration-200 disabled:opacity-40"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
