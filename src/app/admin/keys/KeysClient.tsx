"use client";

/**
 * Ключи-приглашения двух видов:
 *  - «Простой» (profile): регистрация людей с привязанной ролью.
 *  - «Для обзвона» (call): кандидат регистрируется и попадает
 *    на страницу «Ожидайте своего обзвона».
 */

import { useState } from "react";

interface KeyRow {
  id: string;
  code: string;
  purpose: string;
  role: string | null;
  maxUses: number;
  usedCount: number;
  note: string | null;
  createdAt: string;
  expiresAt: string | null;
  disabledAt: string | null;
}

export default function KeysClient({
  keys,
  roles,
}: {
  keys: KeyRow[];
  roles: { id: string; name: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const [purpose, setPurpose] = useState<"profile" | "call">("profile");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState("");
  const [expiresDays, setExpiresDays] = useState(7);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          // для ключа обзвона роль не нужна (кандидат получает «Кандидат»)
          roleId: purpose === "profile" ? roleId : undefined,
          maxUses,
          note: note || undefined,
          expiresDays: expiresDays || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setCreated(json.data.code);
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const disable = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/keys?id=" + id, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
  };

  return (
    <div>
      {error ? (
        <p className="mb-6 text-sm border border-line-strong bg-panel px-4 py-3" role="alert">{error}</p>
      ) : null}
      {created ? (
        <p className="mb-6 border border-paper bg-panel px-4 py-3">
          <span className="track !text-[9px] block mb-1">КЛЮЧ СОЗДАН</span>
          <code className="text-sm font-mono text-paper">{created}</code>
          <button
            onClick={() => copy(created)}
            className="track ml-4 !text-[9px] hover:text-paper transition-colors"
          >
            КОПИРОВАТЬ
          </button>
        </p>
      ) : null}

      {/* Создание ключа */}
      <section className="border border-line bg-panel p-6 mb-8">
        <h2 className="track mb-5">Создать ключ</h2>
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          {/* Тип ключа */}
          <div className="sm:col-span-2">
            <label className="track mb-2 block !text-[9px]">ТИП КЛЮЧА</label>
            <div className="flex gap-px border border-line">
              <button
                type="button"
                onClick={() => setPurpose("profile")}
                className={
                  "flex-1 px-4 py-3 text-xs transition-all duration-200 " +
                  (purpose === "profile"
                    ? "bg-paper text-ink font-medium"
                    : "bg-ink text-fog hover:bg-panel-2")
                }
              >
                Простой (для регистрации)
              </button>
              <button
                type="button"
                onClick={() => setPurpose("call")}
                className={
                  "flex-1 px-4 py-3 text-xs transition-all duration-200 " +
                  (purpose === "call"
                    ? "bg-paper text-ink font-medium"
                    : "bg-ink text-fog hover:bg-panel-2")
                }
              >
                Для обзвона
              </button>
            </div>
            <p className="text-xs text-mist mt-2 leading-relaxed">
              {purpose === "profile"
                ? "Человек регистрируется и получает выбранную роль (сотрудник, админ и т.д.)."
                : "Кандидат регистрируется и попадает на страницу «Ожидайте своего обзвона»."}
            </p>
          </div>

          {purpose === "profile" ? (
            <div>
              <label className="track mb-2 block !text-[9px]">РОЛЬ ПРИ РЕГИСТРАЦИИ *</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full bg-ink border border-line outline-none px-3 py-2 text-sm"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="track mb-2 block !text-[9px]">КОЛИЧЕСТВО АКТИВАЦИЙ</label>
            <input
              type="number"
              min={1}
              max={999}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full bg-ink border border-line outline-none px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="track mb-2 block !text-[9px]">ЗАМЕТКА</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Для кого выдан"
              className="w-full bg-ink border border-line outline-none px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="track mb-2 block !text-[9px]">СРОК ДЕЙСТВИЯ (ДНЕЙ)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={expiresDays}
              onChange={(e) => setExpiresDays(Number(e.target.value))}
              className="w-full bg-ink border border-line outline-none px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy || (purpose === "profile" && !roleId)}
              className="bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)] disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {busy ? "Создание…" : "Создать ключ"}
            </button>
          </div>
        </form>
      </section>

      {/* Список ключей */}
      <h2 className="track mb-4">Все ключи</h2>
      {keys.length === 0 ? (
        <p className="text-sm text-mist">Ключей пока нет.</p>
      ) : (
        <div className="space-y-px bg-line border border-line">
          {keys.map((k) => {
            const expired = k.expiresAt ? new Date(k.expiresAt) < new Date() : false;
            const usedUp = k.usedCount >= k.maxUses;
            const dead = Boolean(k.disabledAt) || expired || usedUp;
            return (
              <div
                key={k.id}
                className="bg-panel px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2"
              >
                <code className="text-sm font-mono">{k.code}</code>
                <span className="track !text-[9px]">
                  {k.purpose === "call" ? "ДЛЯ ОБЗВОНА" : "ПРОСТОЙ"}
                </span>
                <span className="track !text-[9px] !normal-case !tracking-normal">
                  {k.role ?? (k.purpose === "call" ? "кандидат" : "—")}
                </span>
                <span className="text-xs text-fog">
                  {k.usedCount}/{k.maxUses} активаций
                </span>
                {k.note ? <span className="text-xs text-mist">{k.note}</span> : null}
                {dead ? (
                  <span className="track !text-[9px] text-mist">
                    {k.disabledAt ? "ОТКЛЮЧЁН" : expired ? "ИСТЁК" : "ИЗРАСХОДОВАН"}
                  </span>
                ) : (
                  <span className="track !text-[9px] text-paper">АКТИВЕН</span>
                )}
                <span className="ml-auto flex gap-4">
                  <button
                    onClick={() => copy(k.code)}
                    className="track !text-[9px] hover:text-paper transition-colors"
                  >
                    КОПИРОВАТЬ
                  </button>
                  {!k.disabledAt ? (
                    <button
                      onClick={() => disable(k.id)}
                      className="track !text-[9px] hover:text-paper transition-colors"
                    >
                      ОТКЛЮЧИТЬ
                    </button>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
