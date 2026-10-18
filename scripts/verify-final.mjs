const BASE = "https://obr-site-production.up.railway.app";

try {
  const home = await fetch(BASE, { signal: AbortSignal.timeout(30000) });
  const html = await home.text();
  console.log("1. landing:", home.status === 200 ? "OK" : "FAIL " + home.status);
  console.log("2. MISS RP:", html.includes("MISS RP") ? "OK" : "FAIL");
  console.log("3. old brand removed:", !html.includes("RUSSIA RP") ? "OK" : "FAIL");
  console.log("4. intro:", html.includes("начинающий проект") ? "OK" : "FAIL");
  console.log("5. logo:", html.includes("/logo-miss.png") ? "OK" : "FAIL");
  console.log("6. title:", html.includes("MISS RP — Digital Experience") ? "OK" : "FAIL");

  const login = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
  });
  console.log("7. admin login:", login.status === 200 ? "OK" : "FAIL " + login.status);

  const logo = await fetch(BASE + "/logo-miss.png", { signal: AbortSignal.timeout(30000) });
  console.log("8. logo file:", logo.status === 200 ? "OK" : "FAIL " + logo.status);
} catch (e) {
  console.log("ERR:", e.cause?.code ?? e.message);
}
