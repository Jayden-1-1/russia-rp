"use client";

/**
 * Результаты и оценивание.
 * 1 тур: ВО ВРЕМЯ активного обзвона — проверяющий задал вопросы и сразу
 * выставил 0–2 за каждый вопрос («Сохранить оценки 1 тура»). Оценки окончательные.
 *   - >= 25 (билдер): кандидат видит «Перейти ко 2 туру», сессия активна.
 *   - иначе: решение записано, сессия завершена.
 * 2 тур: 6 критериев по 0–2 (макс 12, порог 8) — «Сохранить оценки 2 тура».
 */

import { useMemo, useState } from "react";
import { PASS_THRESHOLD } from "@/lib/calls";

interface AnswerRow {
  id: string;
  questionId: string;
  order: number;
  text: string;
  type: string;
  status: string;
  answerText: string | null;
  criteria: string | null;
  category: string | null;
  maxPoints: number;
}

interface StageResult {
  stage: number;
  score: number;
  max: number;
  passed: boolean;
}

interface DecisionRow {
  decision: string;
  comment: string | null;
  score: number | null;
  examiner: string;
}

interface SessionRow {
  id: string;
  candidate: string;
  variant: string;
  category: string;
  status: string;
  stage: number;
  startedAt: string;
  practiceTitle: string | null;
  stageResults: StageResult[];
  decision: DecisionRow | null;
  answers: AnswerRow[];
}

const PRACTICE_CRITERIA = [
  "Выполнение поставленной задачи (объём реализации)",
  "Работоспособность механик (без критических ошибок)",
  "Качество кода: структура, читаемость, отсутствие хардкода",
  "Безопасность: серверные проверки, защита от читов",
  "Оформление: детали, материалы, освещение локации",
  "Самостоятельность и ход выполнения (вопросы, подход)",
];
const STAGE2_THRESHOLD = 8;
const STAGE2_MAX = 12;

export default function ResultsClient({
  sessions,
  canGrade,
}: {
  sessions: SessionRow[];
  canGrade: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const setScore = (sessionId: string, answerId: string, v: number) => {
    setScores((prev) => ({ ...prev, [sessionId + ":" + answerId]: v }));
  };

  const gradeStage1 = async (s: SessionRow) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = s.answers.map((a) => ({
        questionId: a.questionId,
        score: scores[s.id + ":" + a.id] ?? 0,
      }));
      const res = await fetch("/api/admin/sessions/" + s.id + "/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: payload }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setNotice(json.data.message ?? "Оценки 1 тура сохранены");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const gradeStage2 = async (s: SessionRow) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = PRACTICE_CRITERIA.map((_, i) => ({
        criterion: i,
        score: criteriaScores[s.id + ":" + i] ?? 0,
      }));
      const res = await fetch("/api/admin/sessions/" + s.id + "/grade-stage2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: payload }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setNotice(json.data.message ?? "Оценки 2 тура сохранены");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const totalSel = (s: SessionRow) =>
    s.answers.reduce(
      (sum, a) => sum + (scores[s.id + ":" + a.id] ?? 0),
      0
    );
  const critSel = (s: SessionRow) =>
    PRACTICE_CRITERIA.reduce(
      (sum, _, i) => sum + (criteriaScores[s.id + ":" + i] ?? 0),
      0
    );

  return (
    <div>
      {notice ? (
        <div className="border border-paper bg-panel-2 p-4 mb-4" role="status">
          <p className="text-sm">{notice}</p>
        </div>
      ) : null}
      {error ? (
        <div className="border border-line-strong bg-panel-2 p-4 mb-4" role="alert">
          <p className="text-sm">{error}</p>
        </div>
      ) : null}

      <h1 className="text-3xl font-semibold tracking-tight mb-2">Результаты</h1>
      <p className="text-mist text-sm mb-8">
        1 тур: 0–2 балла за вопрос, порог {PASS_THRESHOLD}. 2 тур (практика):{" "}
        {PRACTICE_CRITERIA.length} критериев по 0–2, порог {STAGE2_THRESHOLD} из{" "}
        {STAGE2_MAX}. Оценки окончательные.
      </p>

      {sessions.length === 0 ? (
        <div className="border border-line bg-panel p-8 text-center">
          <p className="text-mist text-sm">Сессий пока нет.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const open = openId === s.id;
            const stage1 = s.stageResults.find((g) => g.stage === 1);
            const stage2 = s.stageResults.find((g) => g.stage === 2);
            return (
              <div key={s.id} className="border border-line bg-panel">
                <button
                  onClick={() => setOpenId(open ? null : s.id)}
                  aria-expanded={open}
                  className="w-full flex flex-wrap items-center gap-4 px-4 py-4 text-left hover:bg-panel-2 transition-colors"
                >
                  <span className="text-sm font-medium min-w-40">{s.candidate}</span>
                  <span className="text-xs text-mist">{s.category === "builder" ? "Билдер" : "Правила RP"}</span>
                  <span className="track !text-[9px]">
                    {s.status === "active"
                      ? s.stage >= 2
                        ? "2 ТУР ИДЁТ"
                        : "ИДЁТ 1 ТУР"
                      : s.status === "awaiting_review"
                        ? "ОЖИДАЕТ ОЦЕНКИ"
                        : "ПРОВЕРЕНО"}
                  </span>
                  {stage1 ? (
                    <span className="text-xs text-fog">
                      1 тур: {stage1.score}/{stage1.max}{" "}
                      {stage1.passed ? "✓" : "✗"}
                    </span>
                  ) : null}
                  {stage2 ? (
                    <span className="text-xs text-fog">
                      2 тур: {stage2.score}/{stage2.max}{" "}
                      {stage2.passed ? "✓" : "✗"}
                    </span>
                  ) : null}
                  {s.decision ? (
                    <span
                      className={
                        "text-xs ml-auto " +
                        (s.decision.decision === "approved" ? "text-paper" : "text-mist")
                      }
                    >
                      {s.decision.decision === "approved"
                        ? "ПРИНЯТ"
                        : s.decision.decision === "rejected"
                          ? "ОТКЛОНЁН"
                          : "НА ДОРАБОТКЕ"}
                      {s.decision.score !== null ? " · " + s.decision.score + " б." : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-mist ml-auto">
                      {new Date(s.startedAt).toLocaleString("ru-RU")}
                    </span>
                  )}
                </button>

                {open ? (
                  <div className="px-4 pb-6 border-t border-line pt-4">
                    {s.practiceTitle && s.stage >= 2 ? (
                      <div className="border border-line bg-ink p-4 mb-4">
                        <p className="track !text-[9px] mb-1">ЗАДАНИЕ 2 ТУРА</p>
                        <p className="text-sm font-medium">{s.practiceTitle}</p>
                      </div>
                    ) : null}

                    {s.decision && !stage2 ? (
                      <div className="border border-line bg-ink p-4 mb-4">
                        <p className="track !text-[9px] mb-2">РЕШЕНИЕ</p>
                        <p className="text-sm">
                          {s.decision.decision === "approved"
                            ? "Кандидат ПРИНЯТ на должность"
                            : s.decision.decision === "rejected"
                              ? "Кандидат НЕ ПРИНЯТ"
                              : "На доработке"}
                          {s.decision.score !== null ? " · " + s.decision.score + " б." : ""}
                          {" · проверил: "}
                          {s.decision.examiner}
                        </p>
                        {s.decision.comment ? (
                          <p className="text-sm text-fog mt-2">{s.decision.comment}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {/* 1 тур: оценивание ВО ВРЕМЯ активного обзвона */}
                    {canGrade && s.status === "active" && s.stage === 1 && !stage1 ? (
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <p className="track !text-[9px]">
                            ОЦЕНКИ 1 ТУРА — ЗАДАВАЙТЕ ВОПРОСЫ И СТАВЬТЕ 0–2
                          </p>
                          <span className="text-xs text-fog ml-auto">
                            Выбрано: {totalSel(s)} / {s.answers.length * 2} · порог {PASS_THRESHOLD}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {s.answers.map((a, idx) => {
                            const val = scores[s.id + ":" + a.id];
                            return (
                              <div
                                key={a.id}
                                className="border border-line bg-ink p-4 flex flex-wrap items-start gap-4"
                              >
                                <span className="track !text-[10px] w-8 shrink-0 text-mist">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-60">
                                  <p className="text-sm text-paper/90 leading-relaxed">{a.text}</p>
                                  {a.criteria ? (
                                    <p className="text-xs text-mist mt-2">{a.criteria}</p>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  {[0, 1, 2].map((v) => (
                                    <button
                                      key={v}
                                      onClick={() => setScore(s.id, a.id, v)}
                                      aria-label={"Оценка " + v + " балла"}
                                      className={
                                        "w-9 h-9 text-sm border transition-all duration-200 " +
                                        (val === v
                                          ? "bg-paper text-ink border-paper scale-110"
                                          : "border-line text-fog hover:border-line-strong")
                                      }
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => gradeStage1(s)}
                          disabled={busy}
                          className="mt-6 bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40"
                        >
                          {busy ? "Сохранение…" : "Сохранить оценки 1 тура (окончательные)"}
                        </button>
                      </div>
                    ) : null}

                    {/* 1 тур: итог (сохранён) */}
                    {stage1 ? (
                      <div className="border border-line bg-ink p-4 mb-4">
                        <p className="track !text-[9px] mb-2">ИТОГ 1 ТУРА (ОКОНЧАТЕЛЬНЫЙ)</p>
                        <p className="text-sm">
                          {stage1.passed ? "Пройден" : "Не пройден"} · {stage1.score} из{" "}
                          {stage1.max} (порог {PASS_THRESHOLD})
                          {s.status === "active" && s.category === "builder" && stage1.passed
                            ? " · ожидается 2 тур"
                            : ""}
                        </p>
                      </div>
                    ) : null}

                    {/* 2 тур: оценивание практики */}
                    {canGrade && s.status === "active" && s.stage >= 2 && !stage2 ? (
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <p className="track !text-[9px]">
                            ОЦЕНКИ 2 ТУРА (ПРАКТИКА) — 6 КРИТЕРИЕВ ПО 0–2
                          </p>
                          <span className="text-xs text-fog ml-auto">
                            Выбрано: {critSel(s)} / {STAGE2_MAX} · порог {STAGE2_THRESHOLD}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {PRACTICE_CRITERIA.map((c, i) => {
                            const val = criteriaScores[s.id + ":" + i];
                            return (
                              <div
                                key={i}
                                className="border border-line bg-ink p-4 flex flex-wrap items-center gap-4"
                              >
                                <span className="track !text-[10px] w-8 shrink-0 text-mist">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <p className="flex-1 min-w-60 text-sm text-paper/90">{c}</p>
                                <div className="flex items-center gap-2">
                                  {[0, 1, 2].map((v) => (
                                    <button
                                      key={v}
                                      onClick={() =>
                                        setCriteriaScores((prev) => ({
                                          ...prev,
                                          [s.id + ":" + i]: v,
                                        }))
                                      }
                                      aria-label={"Критерий " + (i + 1) + ": " + v + " балла"}
                                      className={
                                        "w-9 h-9 text-sm border transition-all duration-200 " +
                                        (val === v
                                          ? "bg-paper text-ink border-paper scale-110"
                                          : "border-line text-fog hover:border-line-strong")
                                      }
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => gradeStage2(s)}
                          disabled={busy}
                          className="mt-6 bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40"
                        >
                          {busy ? "Сохранение…" : "Сохранить оценки 2 тура (окончательные)"}
                        </button>
                      </div>
                    ) : null}

                    {/* 2 тур: итог */}
                    {stage2 ? (
                      <div className="border border-line bg-ink p-4 mb-4">
                        <p className="track !text-[9px] mb-2">ИТОГ 2 ТУРА (ОКОНЧАТЕЛЬНЫЙ)</p>
                        <p className="text-sm">
                          {stage2.passed ? "Пройден" : "Не пройден"} · {stage2.score} из{" "}
                          {stage2.max} (порог {STAGE2_THRESHOLD})
                        </p>
                      </div>
                    ) : null}

                    {/* Источник вопросов для завершённых сессий */}
                    {s.status !== "active" && s.answers.length > 0 ? (
                      <details className="mt-4">
                        <summary className="track !text-[9px] cursor-pointer text-mist">
                          ВОПРОСЫ 1 ТУРА ({s.answers.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                          {s.answers.map((a, idx) => (
                            <div key={a.id} className="flex gap-3 text-xs">
                              <span className="text-mist shrink-0">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <span className="text-fog">
                                {a.text}
                                {a.answerText ? " — " + a.answerText : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
