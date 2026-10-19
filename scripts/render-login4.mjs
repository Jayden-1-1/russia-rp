import { writeFileSync } from "node:fs";

const email = "3og4es@olipii.com";
const password = "v#L_Mk$XgSx5KP3";

const pre = await fetch("https://dashboard.render.com/api/login", {
  method: "GET",
  headers: { Accept: "application/json" },
});
const preCookies = pre.headers.getSetCookie?.() ?? [];
console.log("pre status:", pre.status, "cookies:", preCookies.map((c) => c.split("=")[0]));

const res = await fetch("https://dashboard.render.com/api/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Origin: "https://dashboard.render.com",
    Referer: "https://dashboard.render.com/",
    ...(preCookies.length ? { Cookie: preCookies.join("; ") } : {}),
  },
  body: JSON.stringify({ email, password }),
  redirect: "manual",
});
const cookies = res.headers.getSetCookie?.() ?? [];
console.log("login status:", res.status, "| new cookies:", cookies.map((c) => c.split("=")[0]));
const text = await res.text();
console.log("body:", text.slice(0, 300));

if (cookies.length > 0) {
  writeFileSync("render-cookies.json", JSON.stringify(cookies), "utf-8");
  console.log("SAVED");
}
