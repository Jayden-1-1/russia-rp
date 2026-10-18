const res = await fetch(
  "https://dns.google/resolve?name=miss-rp-game.up.railway.app&type=A"
);
const json = await res.json();
console.log("Google DNS:", JSON.stringify(json.Answer?.map((a) => a.data) ?? "no answer"));

const res2 = await fetch(
  "https://dns.google/resolve?name=up.railway.app&type=A"
);
const json2 = await res2.json();
console.log("up.railway.app:", JSON.stringify(json2.Answer?.map((a) => a.data) ?? "no answer"));
