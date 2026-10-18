"use client";

/**
 * Профили сотрудников: создание аккаунтов, выдача ролей и должностей,
 * смена пароля, деактивация.
 */

import { useState } from "react";
import { Empty } from "@/components/ui";

interface Role {
  id: string;
  name: string;
  capabilities: string[];
}

interface Profile {
  id: string;
  login: string;
  displayName: string | null;
  position: string | null;
  isRootAdmin: boolean;
  isActive: boolean;
  roleIds: string[];
  roleNames: string[];
  lastSeenAt: string;
}

export default function ProfilesClient({
  profiles,
  roles,
  canEdit,
}: {
  profiles: Profile[];
  roles: Role[];
  canEdit: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Создание
  const [nLogin, setNLogin] = useState("");
  const [nPass, setNPass] = useState("");
  const [nName, setNName] = useState("");
  const [nPos, setNPos] = useState("");
  const [nRoles, setNRoles] = useState<string[]>([]);

  // Редактирование
  const [edit, setEdit] = useState<Profile | null>(null);
  const [ePos, setEPos] = useState("");
  const [eRoles, setERoles] = useState<string[]>([]);
  const [ePass, setEPass] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: nLogin,
          password: nPass,
          displayName: nName || undefined,
          position: nPos || undefined,
          roleIds: nRoles,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(`Профиль ${nLogin} создан`);
      setNLogin("");
      setNPass("");
      setNName("");
      setNPos("");
      setNRoles([]);
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
      const res = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: edit.id,
          position: ePos,
          roleIds: eRoles,
          newPassword: ePass || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(`Профиль ${edit.login} обновлён`);
      setEdit(null);
      setEPass("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: Profile) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: p.id, isActive: !p.isActive }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      setMessage(`${p.login}: ${p.isActive ? "деактивирован" : "активирован"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div>
      {error ? (
        <p className="mb-6 text-sm border border-line-strong bg-panel px-4 py-3" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-6 text-sm text-paper border border-line bg-panel px-4 py-3">{message}</p>
      ) : null}

      {/* Создание профиля */}
      <section className="border border-line bg-panel p-6 mb-8">
        <h2 className="track mb-5">Создать профиль</h2>
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="track mb-2 block !text-[9px]">ЛОГИН *</label>
            <input
              value={nLogin}
              onChange={(e) => setNLogin(e.target.value)}
              required
              minLength={3}
              pattern="[a-zA-Z0-9_.\-]+"
              className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="track mb-2 block !text-[9px]">ПАРОЛЬ * (6+)</label>
            <input
              type="password"
              value={nPass}
              onChange={(e) => setNPass(e.target.value)}
              required
              minLength={6}
              className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="track mb-2 block !text-[9px]">ИМЯ</label>
            <input
              value={nName}
              onChange={(e) => setNName(e.target.value)}
              className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="track mb-2 block !text-[9px]">ДОЛЖНОСТЬ</label>
            <input
              value={nPos}
              onChange={(e) => setNPos(e.target.value)}
              placeholder="Администратор игры"
              className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="track mb-2 block !text-[9px]">РОЛИ</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setNRoles((l) => toggleIn(l, r.id))}
                  className={
                    "px-3 py-2 text-xs border transition-all " +
                    (nRoles.includes(r.id)
                      ? "bg-paper text-ink border-paper"
                      : "border-line text-fog hover:border-line-strong")
                  }
                >
                  {r.name}
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
              {busy ? "Создание…" : "Создать профиль"}
            </button>
          </div>
        </form>
      </section>

      {/* Список профилей */}
      <h2 className="track mb-4">Все профили</h2>
      {profiles.length === 0 ? (
        <Empty>Профилей нет.</Empty>
      ) : (
        <div className="space-y-px bg-line border border-line">
          {profiles.map((p) => {
            const open = edit?.id === p.id;
            return (
              <div key={p.id} className="bg-panel">
                <div className="w-full flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                  <span className="text-sm">
                    {p.displayName ?? p.login}
                    {p.isRootAdmin ? <span className="track ml-2 !text-[9px] text-paper">ROOT</span> : null}
                  </span>
                  <span className="track !text-[9px] !normal-case !tracking-normal text-fog">
                    {p.roleNames.join(" · ") || "без ролей"}
                  </span>
                  {p.position ? (
                    <span className="text-xs text-mist">{p.position}</span>
                  ) : null}
                  {!p.isActive ? <span className="track !text-[9px] text-mist">ДЕАКТИВИРОВАН</span> : null}
                  <span className="ml-auto flex gap-4">
                    {canEdit && !p.isRootAdmin ? (
                      <button
                        onClick={() => toggleActive(p)}
                        className="track !text-[9px] hover:text-paper transition-colors"
                      >
                        {p.isActive ? "ОТКЛЮЧИТЬ" : "ВКЛЮЧИТЬ"}
                      </button>
                    ) : null}
                    {canEdit ? (
                      <button
                        onClick={() => {
                          setEdit(open ? null : p);
                          setEPos(p.position ?? "");
                          setERoles(p.roleIds);
                        }}
                        className="track !text-[9px] hover:text-paper transition-colors"
                      >
                        {open ? "ЗАКРЫТЬ" : "ИЗМЕНИТЬ"}
                      </button>
                    ) : null}
                  </span>
                </div>

                {open ? (
                  <div className="px-5 pb-6 border-t border-line pt-5">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="track mb-2 block !text-[9px]">ДОЛЖНОСТЬ</label>
                        <input
                          value={ePos}
                          onChange={(e) => setEPos(e.target.value)}
                          className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="track mb-2 block !text-[9px]">НОВЫЙ ПАРОЛЬ (опционально)</label>
                        <input
                          type="password"
                          value={ePass}
                          onChange={(e) => setEPass(e.target.value)}
                          minLength={6}
                          className="w-full bg-ink border border-line outline-none focus:border-line-strong px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <label className="track mb-2 block !text-[9px]">РОЛИ</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roles.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setERoles((l) => toggleIn(l, r.id))}
                          className={
                            "px-3 py-2 text-xs border transition-all " +
                            (eRoles.includes(r.id)
                              ? "bg-paper text-ink border-paper"
                              : "border-line text-fog hover:border-line-strong")
                          }
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={saveEdit}
                      disabled={busy}
                      className="bg-paper text-ink px-6 py-3 text-sm font-medium hover:bg-fog transition-colors disabled:opacity-40"
                    >
                      Сохранить
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
