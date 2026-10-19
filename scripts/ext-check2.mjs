const res = await fetch("https://api.codetabs.com/v1/proxy?quest=https://obr-site-production.up.railway.app", { signal: AbortSignal.timeout(60000) });
const text = await res.text();
console.log("status:", res.status, "| MISS RP:", text.includes("MISS RP"), "| len:", text.length);