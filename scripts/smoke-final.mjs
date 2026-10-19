const BASE = "https://obr-site-production.up.railway.app";
const home = await fetch(BASE, { signal: AbortSignal.timeout(30000) });
const html = await home.text();
console.log("1. landing:", home.status);
console.log("2. MISS RP:", html.includes("MISS RP"));
console.log("3. intro:", html.includes("начинающий проект"));
console.log("4. logo:", html.includes("/logo-miss.png"));
console.log("5. old brand:", !html.includes("RUSSIA RP"));
const login = await fetch(BASE + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ login: "admin", password: "admin123" }),
});
console.log("6. admin login:", login.status);