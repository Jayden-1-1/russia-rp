const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://onelocal.host/"), { signal: AbortSignal.timeout(45000) });
const text = await res.text();
console.log("status:", res.status, "len:", text.length);
const t = text.match(/<title>(.*?)<\/title>/);
console.log("title:", t ? t[1] : "?");