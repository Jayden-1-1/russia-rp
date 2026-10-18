"use client";

import { useEffect, useState } from "react";

/** Динамическое приветствие по локальному времени пользователя. */
export function greetingFor(date: Date): { text: string; index: string } {
  const h = date.getHours();
  if (h >= 5 && h < 12) return { text: "Доброе утро", index: "01" };
  if (h >= 12 && h < 18) return { text: "Добрый день", index: "02" };
  if (h >= 18 && h < 23) return { text: "Добрый вечер", index: "03" };
  return { text: "Доброй ночи", index: "04" };
}

export default function Greeting() {
  const [g, setG] = useState<{ text: string; index: string } | null>(null);

  useEffect(() => {
    setG(greetingFor(new Date()));
    const timer = setInterval(() => setG(greetingFor(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);

  const current = g ?? { text: "Добро пожаловать", index: "00" };
  return (
    <p className="track" aria-live="polite">
      {current.index} / {current.text}
    </p>
  );
}
