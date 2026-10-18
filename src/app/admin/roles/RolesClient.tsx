"use client";

/**
 * Роли сайта и матрица доступа: создание, правка прав, удаление.
 */

import { useState } from "react";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  capabilities: string[];
  usersCount: number;
  keysCount: number;
}

export default function RolesClient({
  roles,
  allCapabilities,
}: {
  roles: RoleRow[];
  allCapabilities: { id: string; label: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [nName, setNName] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nCaps, setNCaps] = useState<string[]>(["cabinet.view"]);

  const [edit, setEdit] = useState<RoleRow | null>(null);
  const [eCaps, setECaps] = useState<string[]>([]);

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nName,
          description: nDesc || undefined,
          capabilities: nCaps,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(`Роль «${nName}» создана`);
      setNName("");
      setNDesc("");
      setNCaps(["cabinet.view"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: edit.id, capabilities: eCaps }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(`Роль «${edit.name}» обновлена`);
      setEdit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: RoleRow) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/roles?id=" + r.id, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(`Роль «${r.name}» удалена`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {error ? (
        <p className="mb-6 text-sm border border-line-strong bg-panel px-4 py-3" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-6 text-sm text-paper border border-line bg-panel px-4 py-3">{message}</p>
      ) : null}

      {/* Создание роли */}
      <section className="border border-line bg-panel p-6 mb-8">
        <h2 className="track mb-5">Создать роль</h2>
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="track mb-2 block !text-[9px]">НАЗВАНИЕ *</label>
            <input
              value={nName}
              onChange={(e) => setNName(e.target.value)}
              placeholder="Билдер-скриптер"
              required
              minLength={2}
              className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="track mb-2 block !text-[9px]">ОПИСАНИЕ</label>
            <input
              value={nDesc}
              onChange={(e) => setNDesc(e.target.value)}
              className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="track mb-2 block !text-[9px]">ВОЗМОЖНОСТИ</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {allCapabilities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNCaps((l) => toggleIn(l, c.id))}
                  className={
                    "text-left px-3 py-2 text-xs border transition-all " +
                    (nCaps.includes(c.id)
                      ? "bg-paper text-ink border-paper"
                      : "border-line text-fog hover:border-line-strong")
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40"
            >
              {busy ? "Создание…" : "Создать роль"}
            </button>
          </div>
        </form>
      </section>

      {/* Список ролей */}
      <h2 className="track mb-4">Все роли</h2>
      {roles.length === 0 ? (
        <p className="text-sm text-mist">Ролей пока нет.</p>
      ) : (
        <div className="space-y-px bg-line border border-line">
          {roles.map((r) => {
            const open = edit?.id === r.id;
            return (
              <div key={r.id} className="bg-panel">
                <div className="px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="text-sm">{r.name}</span>
                  <span className="text-xs text-fog">
                    {r.capabilities.length} прав · {r.usersCount} чел · {r.keysCount} ключей
                  </span>
                  {r.description ? (
                    <span className="text-xs text-mist">{r.description}</span>
                  ) : null}
                  <span className="ml-auto flex gap-4">
                    <button
                      onClick={() => {
                        setEdit(open ? null : r);
                        setECaps(r.capabilities);
                      }}
                      className="track !text-[9px] hover:text-paper transition-colors"
                    >
                      {open ? "ЗАКРЫТЬ" : "ПРАВА"}
                    </button>
                    {r.usersCount === 0 && r.keysCount === 0 ? (
                      <button
                        onClick={() => remove(r)}
                        className="track !text-[9px] hover:text-paper transition-colors"
                      >
                        УДАЛИТЬ
                      </button>
                    ) : null}
                  </span>
                </div>

                {open ? (
                  <div className="px-5 pb-6 border-t border-line pt-5">
                    <label className="track mb-2 block !text-[9px]">ВОЗМОЖНОСТИ РОЛИ</label>
                    <div className="grid sm:grid-cols-2 gap-2 mb-4">
                      {allCapabilities.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setECaps((l) => toggleIn(l, c.id))}
                          className={
                            "text-left px-3 py-2 text-xs border transition-all " +
                            (eCaps.includes(c.id)
                              ? "bg-paper text-ink border-paper"
                              : "border-line text-fog hover:border-line-strong")
                          }
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={saveEdit}
                      disabled={busy}
                      className="bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog transition-colors disabled:opacity-40"
                    >
                      Сохранить права
                    </button>
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
