const BASE = "https://obr-site-production.up.railway.app";

async function main() {
  // 1. Логин root-админа
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
  });
  const loginJson = await loginRes.json().catch(() => null);
  const cookies = loginRes.headers.getSetCookie?.() ?? [];
  const sessionCookie = cookies.find((c) => c.startsWith("session")) ?? cookies[0];
  console.log("login:", loginRes.status, JSON.stringify(loginJson?.error ?? "ok"));

  // 2. Кабинет админа
  if (sessionCookie) {
    const adminRes = await fetch(BASE + "/admin", {
      headers: { Cookie: sessionCookie.split(";")[0] },
      redirect: "manual",
    });
    console.log("admin page:", adminRes.status);

    // 3. Создание ключа
    const keyRes = await fetch(BASE + "/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie.split(";")[0] },
      body: JSON.stringify({ purpose: "call", maxUses: 1, note: "prod-smoke", expiresDays: 1 }),
    });
    const keyJson = await keyRes.json();
    console.log("key create:", keyRes.status, keyJson.data?.code ?? keyJson.error);
  }
}

main().catch((e) => console.error("FAIL:", e.message));
