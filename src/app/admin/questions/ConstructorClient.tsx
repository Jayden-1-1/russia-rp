"use client";

import { useState } from "react";
import { QUESTION_TYPES } from "@/lib/questions-shared";

interface QuestionRow {
  id: string;
  order: number;
  text: string;
  type: string;
  timeLimitSec: number;
  required: boolean;
  points: number;
  criteria: string | null;
  category: string | null;
}

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  questions: QuestionRow[];
}

export default function ConstructorClient({ initialTemplates }: { initialTemplates: TemplateRow[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTemplates[0]?.id ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newTemplate, setNewTemplate] = useState("");

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const api = async (url: string, method: string, body?: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      return json.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.trim()) return;
    const data = await api("/api/admin/templates", "POST", { name: newTemplate.trim() });
    if (data) {
      setTemplates((prev) => [
        { id: data.template.id, name: data.template.name, description: null, isActive: true, questions: [] },
        ...prev,
      ]);
      setSelectedId(data.template.id);
      setNewTemplate("");
    }
  };

  const copyTemplate = async (id: string) => {
    const data = await api(`/api/admin/templates/${id}/copy`, "POST");
    if (data) {
      setTemplates((prev) => [data.template, ...prev]);
      setSelectedId(data.template.id);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Удалить шаблон и все его вопросы?")) return;
    const data = await api(`/api/admin/templates/${id}`, "DELETE");
    if (data) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const addQuestion = async () => {
    if (!selected) return;
    const data = await api("/api/admin/questions", "POST", { templateId: selected.id });
    if (data) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selected.id ? { ...t, questions: [...t.questions, data.question] } : t
        )
      );
    }
  };

  const updateQuestion = async (questionId: string, patch: Partial<QuestionRow>) => {
    if (!selected) return;
    const data = await api(`/api/admin/questions/${questionId}`, "PATCH", patch);
    if (data) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id !== selected.id
            ? t
            : { ...t, questions: t.questions.map((q) => (q.id === questionId ? data.question : q)) }
        )
      );
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Удалить вопрос?")) return;
    const templateId = selected?.id;
    if (!templateId) return;
    const data = await api(`/api/admin/questions/${questionId}`, "DELETE");
    if (data) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id !== templateId
            ? t
            : { ...t, questions: t.questions.filter((q) => q.id !== questionId) }
        )
      );
    }
  };

  const move = async (questionId: string, dir: -1 | 1) => {
    if (!selected) return;
    const data = await api(`/api/admin/questions/${questionId}/move`, "POST", { dir });
    if (data) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, questions: data.questions } : t))
      );
    }
  };

  return (
    <div>
      {/* Шаблоны */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="track">Шаблоны обзвонов</h2>
          <div className="flex-1 flex gap-2 min-w-64">
            <input
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              placeholder="Название нового шаблона…"
              aria-label="Название шаблона"
              className="flex-1 bg-ink border border-line focus:border-line-strong outline-none px-4 py-2.5 text-sm"
            />
            <button
              onClick={createTemplate}
              disabled={busy || !newTemplate.trim()}
              className="bg-paper text-ink px-5 py-2.5 text-sm font-medium hover:bg-fog transition-colors disabled:opacity-40"
            >
              Создать
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 border px-4 py-2.5 cursor-pointer transition-colors ${
                selectedId === t.id ? "border-paper bg-panel-2" : "border-line hover:border-line-strong"
              }`}
              onClick={() => setSelectedId(t.id)}
            >
              <span className="text-sm">{t.name}</span>
              <span className="track !text-[9px]">{t.questions.length} вопр.</span>
              {!t.isActive ? <span className="track !text-[9px]">неактивен</span> : null}
            </div>
          ))}
          {templates.length === 0 ? (
            <p className="text-mist text-sm">Шаблонов пока нет — создайте первый.</p>
          ) : null}
        </div>
        {selected ? (
          <div className="flex gap-6 mt-4">
            <button onClick={() => copyTemplate(selected.id)} className="track hover:text-paper transition-colors">
              Копировать шаблон
            </button>
            <button onClick={() => deleteTemplate(selected.id)} className="track hover:text-paper transition-colors">
              Удалить шаблон
            </button>
          </div>
        ) : null}
      </section>

      {error ? <p className="mb-6 text-sm text-fog" role="alert">{error}</p> : null}

      {/* Вопросы */}
      {selected ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="track">Вопросы: {selected.name}</h2>
            <button
              onClick={addQuestion}
              disabled={busy}
              className="bg-paper text-ink px-5 py-2.5 text-sm font-medium hover:bg-fog transition-colors disabled:opacity-40"
            >
              + Добавить вопрос
            </button>
          </div>

          {selected.questions.length ? (
            <div className="space-y-px bg-line border border-line">
              {selected.questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  index={i}
                  question={q}
                  first={i === 0}
                  last={i === selected.questions.length - 1}
                  busy={busy}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                  onMove={move}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-line px-6 py-10 text-center text-mist text-sm">
              Вопросов нет. Добавьте первый вопрос.
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  first,
  last,
  busy,
  onUpdate,
  onDelete,
  onMove,
}: {
  question: QuestionRow;
  index: number;
  first: boolean;
  last: boolean;
  busy: boolean;
  onUpdate: (id: string, patch: Partial<QuestionRow>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [text, setText] = useState(question.text);
  const [timeLimit, setTimeLimit] = useState(question.timeLimitSec);
  const [points, setPoints] = useState(question.points);
  const [criteria, setCriteria] = useState(question.criteria ?? "");
  const [category, setCategory] = useState(question.category ?? "");

  const save = () =>
    onUpdate(question.id, {
      text: text.trim(),
      timeLimitSec: Number(timeLimit) || 0,
      points: Number(points) || 0,
      criteria: criteria.trim() || null,
      category: category.trim() || null,
    });

  return (
    <div className="bg-panel p-5">
      <div className="flex items-center gap-4 mb-4">
        <span className="track">{String(index + 1).padStart(2, "0")}</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          aria-label="Формулировка вопроса"
          className="flex-1 bg-ink border border-line focus:border-line-strong outline-none px-4 py-2.5 text-sm"
          placeholder="Формулировка вопроса…"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onMove(question.id, -1)}
            disabled={first || busy}
            aria-label="Выше"
            className="track hover:text-paper disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(question.id, 1)}
            disabled={last || busy}
            aria-label="Ниже"
            className="track hover:text-paper disabled:opacity-30"
          >
            ↓
          </button>
          <button
            onClick={() => onDelete(question.id)}
            disabled={busy}
            aria-label="Удалить вопрос"
            className="track hover:text-paper"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <label className="text-xs text-mist">
          Тип ответа
          <select
            value={question.type}
            onChange={(e) => onUpdate(question.id, { type: e.target.value })}
            className="mt-1 w-full bg-ink border border-line outline-none px-3 py-2 text-sm text-paper"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-mist">
          Лимит, сек
          <input
            type="number"
            min={0}
            max={3600}
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            onBlur={save}
            className="mt-1 w-full bg-ink border border-line outline-none px-3 py-2 text-sm text-paper"
          />
        </label>
        <label className="text-xs text-mist">
          Баллы
          <input
            type="number"
            min={0}
            max={100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            onBlur={save}
            className="mt-1 w-full bg-ink border border-line outline-none px-3 py-2 text-sm text-paper"
          />
        </label>
        <label className="text-xs text-mist flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => onUpdate(question.id, { required: e.target.checked })}
            className="w-4 h-4 accent-white"
          />
          Обязательный
        </label>
        <label className="text-xs text-mist">
          Категория
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={save}
            className="mt-1 w-full bg-ink border border-line outline-none px-3 py-2 text-sm text-paper"
            placeholder="общая / роль…"
          />
        </label>
      </div>
      <input
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
        onBlur={save}
        aria-label="Критерии проверки"
        className="mt-4 w-full bg-ink border border-line focus:border-line-strong outline-none px-4 py-2.5 text-sm"
        placeholder="Критерии ручной проверки…"
      />
    </div>
  );
}
