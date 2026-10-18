const BASE = "https://miss-rp-game.up.railway.app";

async function main() {
  // Лендинг с новым брендом
  const home = await fetch(BASE + "/");
  const html = await home.text();
  console.log("1. landing:", home.status === 200 ? "OK" : "FAIL " + home.status);
  console.log("2. MISS RP in page:", html.includes("MISS RP") ? "OK" : "FAIL");
  console.log("3. old brand removed:", !html.includes("RUSSIA RP") ? "OK" : "FAIL (still RUSSIA RP)");
  console.log("4. intro text:", html.includes("начинающий проект") ? "OK" : "FAIL");
  console.log("5. logo referenced:", html.includes("/logo-miss.png") ? "OK" : "FAIL");
  console.log("6. title MISS RP:", html.includes("MISS RP — Digital Experience") ? "OK" : "FAIL");

  // Логин
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "admin123" }),
  });
  console.log("7. admin login:", loginRes.status === 200 ? "OK" : "FAIL " + loginRes.status);

  // Логотип файл
  const logo = await fetch(BASE + "/logo-miss.png");
  console.log("8. logo file:", logo.status === 200 ? "OK (" + logo.headers.get("content-type") + ")" : "FAIL");
}

main().catch((e) => console.error("FAIL:", e.message));
