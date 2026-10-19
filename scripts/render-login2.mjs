import { writeFileSync } from "node:fs";

const email = "3og4es@olipii.com";
const password = "v#L_Mk$XgSx5KP3";

// Возможные эндпоинты
const endpoints = [
  "https://dashboard.render.com/api/login",
  "https://api.render.com/api/v1/login",
  "https://dashboard.render.com/login",
];

for (const url of endpoints) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      redirect: "manual",
    });
    const cookies = res.headers.getSetCookie?.() ?? [];
    console.log(url, "->", res.status, "| cookies:", cookies.length);
    if (res.status === 200 || res.status === 302) {
      const body = await res.text().catch(() => "");
      console.log("  body:", body.slice(0, 300));
      if (cookies.length > 0) {
        writeFileSync("render-cookies.json", JSON.stringify(cookies), "utf-8");
        console.log("  COOKIES SAVED");
      }
    }
  } catch (e) {
    console.log(url, "-> ERR", e.message.slice(0, 100));
  }
}
