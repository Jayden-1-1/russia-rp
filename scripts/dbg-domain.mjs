const BASE = "https://miss-rp-game.up.railway.app";
try {
  const res = await fetch(BASE);
  console.log("status:", res.status);
} catch (e) {
  console.log("name:", e.name);
  console.log("message:", e.message);
  console.log("cause:", e.cause?.code, e.cause?.message);
}
