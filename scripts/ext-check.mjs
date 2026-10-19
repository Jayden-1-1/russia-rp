const target = encodeURIComponent("https://obr-site-production.up.railway.app");
try {
  const res = await fetch("https://httpstatus.io/api/check?u=" + target, { signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  console.log(res.status, text.slice(0, 300));
} catch (e) {
  console.log("err", e.message.slice(0, 80));
}