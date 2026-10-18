const BASE = "https://obr-site-production.up.railway.app";

async function main() {
  // 1. Логин админа
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
  });
  const cookies = loginRes.headers.getSetCookie?.() ?? [];
  const cookie = (cookies[0] ?? "").split(";")[0];
  console.log("1. admin login:", loginRes.status === 200 ? "OK" : "FAIL");

  // 2. Ключ-приглашение (обзвон)
  const keyRes = await fetch(BASE + "/api/admin/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ purpose: "call", maxUses: 2, note: "prod-smoke", expiresDays: 1 }),
  });
  const keyJson = await keyRes.json();
  const code = keyJson.data?.code;
  console.log("2. call key created:", code ?? "FAIL " + keyJson.error);

  // 3. Регистрация по ключу
  const regRes = await fetch(BASE + "/api/keys/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, login: "prodsmoke_" + Date.now(), password: "test12345", displayName: "Smoke" }),
  });
  const regJson = await regRes.json();
  console.log("3. register by key:", regRes.status === 200 ? "OK → " + (regJson.data?.redirect ?? "") : "FAIL " + (regJson.error ?? ""));

  // 4. Страница ожидания
  const waitRes = await fetch(BASE + "/calls/wait", { redirect: "manual" });
  console.log("4. waiting room page:", waitRes.status === 200 ? "OK" : waitRes.status);

  // 5. Профили (админ)
  const profRes = await fetch(BASE + "/api/admin/profiles", { headers: { Cookie: cookie } });
  const profJson = await profRes.json();
  console.log("5. profiles API:", profRes.status === 200 ? "OK (" + (profJson.data?.profiles?.length ?? "?") + " профилей)" : "FAIL");

  // 6. Главная страница
  const homeRes = await fetch(BASE + "/");
  console.log("6. landing page:", homeRes.status === 200 ? "OK" : "FAIL " + homeRes.status);
}

main().catch((e) => console.error("FAIL:", e.message));
