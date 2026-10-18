try {
  const res = await fetch("https://isitup.org/miss-rp-game.up.railway.app.json");
  const json = await res.json();
  console.log("isitup:", JSON.stringify(json));
} catch (e) {
  console.log("isitup err:", e.message);
}

// Также проверим через r.jina.ai (прокси-ридер):
try {
  const res = await fetch("https://r.jina.ai/https://miss-rp-game.up.railway.app", {
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  console.log("jina reader status:", res.status);
  console.log("content sample:", text.slice(0, 300));
} catch (e) {
  console.log("jina err:", e.message.slice(0, 100));
}
