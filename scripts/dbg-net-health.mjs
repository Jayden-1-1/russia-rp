const sites = ["https://example.com", "https://github.com", "https://railway.app"];
for (const u of sites) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(10000), redirect: "manual" });
    console.log(u, "->", r.status);
  } catch (e) {
    console.log(u, "->", e.cause?.code ?? e.message);
  }
}
