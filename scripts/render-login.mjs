// Логин на render.com, сохранение сессионных cookie
import { writeFileSync } from "node:fs";

const email = "3og4es@olipii.com";
const password = "v#L_Mk$XgSx5KP3";

const res = await fetch("https://api.render.com/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

console.log("login status:", res.status);
const cookies = res.headers.getSetCookie?.() ?? [];
console.log("cookies:", cookies.map((c) => c.split("=")[0]).join(", "));
const body = await res.text().catch(() => "");
console.log("body sample:", body.slice(0, 200));

if (cookies.length > 0) {
  writeFileSync("render-cookies.json", JSON.stringify(cookies), "utf-8");
  console.log("cookies saved");
}
