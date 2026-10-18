"use client";

/**
 * Вход: логин + пароль.
 * Кандидаты регистрируются по ключу-приглашению (вкладка «По ключу»).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedGrid from "@/components/AnimatedGrid";

export default function LoginClient({
  error,
  registered,
}: {
  error?: string;
  registered?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "key">("login");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [newLogin, setNewLogin] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyOk, setKeyOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка входа");
      router.push("/cabinet");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  const registerByKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyBusy(true);
    setFormError(null);
    setKeyOk(null);
    try {
      const res = await fetch("/api/keys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          login: newLogin,
          displayName: newName,
          password: newPassword,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка регистрации");
      // Регистрация по ключу сразу выполняет вход
      if (json.data && json.data.redirect) {
        router.push(json.data.redirect);
        router.refresh();
        return;
      }
      setKeyOk("Аккаунт создан. Теперь войдите на вкладку «Вход».");
      setTab("login");
      setLogin(newLogin);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setKeyBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-ink flex items-center justify-center px-6 py-12">
      <AnimatedGrid aria-hidden />
      <div className="w-full max-w-md">
        <a href="/" className="track hover:text-fog transition-colors">← На главную</a>
        <div className="mt-6 border border-line bg-panel p-8 rise">
          <h1 className="text-2xl font-semibold tracking-tight">Вход в RUSSIA RP</h1>
          <p className="mt-2 text-sm text-mist">
            Личный аккаунт проекта. Доступы выдаёт администрация.
          </p>

          {formError ?? error ? (
            <p className="mt-6 text-sm border border-line-strong bg-ink px-4 py-3" role="alert">
              {formError ?? error}
            </p>
          ) : null}
          {registered ? (
            <p className="mt-6 text-sm text-fog border border-line bg-ink px-4 py-3">
              Аккаунт создан. Войдите по логину и паролю.
            </p>
          ) : null}
          {keyOk ? (
            <p className="mt-6 text-sm text-paper border border-line bg-ink px-4 py-3">
              {keyOk}
            </p>
          ) : null}

          <div className="mt-8 flex gap-px border border-line">
            <button
              onClick={() => setTab("login")}
              className={
                "flex-1 px-4 py-3 text-sm transition-colors " +
                (tab === "login"
                  ? "bg-paper text-ink font-medium"
                  : "bg-ink text-fog hover:bg-panel-2")
              }
            >
              Вход
            </button>
            <button
              onClick={() => setTab("key")}
              className={
                "flex-1 px-4 py-3 text-sm transition-colors " +
                (tab === "key"
                  ? "bg-paper text-ink font-medium"
                  : "bg-ink text-fog hover:bg-panel-2")
              }
            >
              По ключу
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="login" className="track mb-2 block">ЛОГИН</label>
                <input
                  id="login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full bg-ink border border-line outline-none focus:border-line-strong px-4 py-3 text-sm transition-colors"
                />
              </div>
              <div>
                <label htmlFor="password" className="track mb-2 block">ПАРОЛЬ</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full bg-ink border border-line outline-none focus:border-line-strong px-4 py-3 text-sm transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-paper text-ink px-6 py-4 text-sm font-medium hover:bg-fog transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40"
              >
                {busy ? "Вход…" : "Войти"}
              </button>
            </form>
          ) : (
            <form onSubmit={registerByKey} className="mt-6 space-y-4">
              <p className="text-xs text-mist leading-relaxed">
                Введите ключ-приглашение от администрации и создайте свой аккаунт.
              </p>
              <div>
                <label htmlFor="code" className="track mb-2 block">КЛЮЧ</label>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="RRP-XXXX-XXXX"
                  required
                  className="w-full bg-ink border border-line outline-none focus:border-line-strong px-4 py-3 text-sm font-mono transition-colors"
                />
              </div>
              <div>
                <label htmlFor="newlogin" className="track mb-2 block">ЛОГИН</label>
                <input
                  id="newlogin"
                  value={newLogin}
                  onChange={(e) => setNewLogin(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full bg-ink border border-line outline-none focus:border-line-strong px-4 py-3 text-sm transition-colors"
                />
              </div>
              <div>
                <label htmlFor="newname" className="track mb-2 block">ИМЯ (необязательно)</label>
                <input
                  id="newname"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-ink border border-line outline-none focus:border-line-strong px-4 py-3 text-sm transition-colors"
                />
              </div>
              <div>
                <label htmlFor="newpassword" className="track mb-2 block">ПАРОЛЬ</label>
                <input
                  id="newpassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full bg-ink border border-line outline-none focus:border-line-strong px-4 py-3 text-sm transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={keyBusy}
                className="w-full bg-paper text-ink px-6 py-4 text-sm font-medium hover:bg-fog transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40"
              >
                {keyBusy ? "Регистрация…" : "Создать аккаунт"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
