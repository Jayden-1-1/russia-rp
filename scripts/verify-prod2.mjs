const BASE = "https://obr-site-production.up.railway.app";

for (let i = 0; i < 3; i++) {
  const res = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
  });
  const json = await res.json().catch(() => null);
  console.log("attempt", i + 1, ":", res.status, JSON.stringify(json?.error ?? json?.data ?? "ok"));
  if (res.status === 200) break;
  await new Promise((r) => setTimeout(r, 2000));
}
