import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сессии и права проверяются на сервере при каждом запросе —
  // отключаем Cache Components, чтобы страницы были динамическими.
  cacheComponents: false,
};

export default nextConfig;
