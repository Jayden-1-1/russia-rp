const email = "3og4es@olipii.com";
const password = "v#L_Mk$XgSx5KP3";

const res = await fetch("https://dashboard.render.com/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "*/*" },
  body: JSON.stringify({ email, password, beta_features: [] }),
  redirect: "manual",
});
console.log("status:", res.status);
const hdrs = {};
for (const [k, v] of res.headers) hdrs[k] = v;
console.log("headers:", JSON.stringify(hdrs, null, 1).slice(0, 1200));
const text = await res.text();
console.log("body:", text.slice(0, 500));
