"use client";

/**
 * Экран прохождения обзвона для КАНДИДАТА.
 * 1 тур: «ВЫ СЕЙЧАС ПРОХОДИТЕ ОБЗВОН» + игра Dino; проверяющий задаёт вопросы
 * и сразу выставляет оценки (окончательные).
 *  - >= 25 баллов и билдер → кнопка «Перейти ко 2 туру» (сразу таймер 1 час).
 *  - иначе → итог.
 * 2 тур: задание сверху + таймер по центру (полоса уменьшается).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { drawTrex } from "./trex";

interface PracticeInfo {
  title: string;
  brief: string;
  requirements: string;
  deadline: string | null;
}

interface StageResult {
  score: number;
  max: number;
  passed: boolean;
}

interface SessionState {
  id: string;
  status: string;
  stage: number;
  examiner: string | null;
  stage1: StageResult | null;
  stage2: StageResult | null;
  practice: PracticeInfo | null;
}

type Phase =
  | { kind: "idle" }
  | { kind: "waitingExaminer" }
  | { kind: "claim"; examiner: string }
  | { kind: "running" }
  | { kind: "stage1Passed"; score: number; max: number }
  | { kind: "stage1Failed"; score: number; max: number }
  | { kind: "stage2Practice"; practice: PracticeInfo }
  | { kind: "review" }
  | { kind: "finished" }
  | { kind: "error"; message: string };

export default function TakeClient({
  assignmentId,
  category,
}: {
  assignmentId: string;
  category: string;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [examiner, setExaminer] = useState<string | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls/${assignmentId}/state`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      const s = json.data.session as SessionState | null;
      if (!s) {
        setPhase({ kind: "idle" });
        return;
      }
      setExaminer(s.examiner);
      const cur = phaseRef.current;

      if (s.status === "completed" || s.stage2) {
        setPhase({ kind: "finished" });
      } else if (s.status === "awaiting_review") {
        setPhase({ kind: "review" });
      } else if (s.practice && s.stage >= 2) {
        if (cur.kind !== "stage2Practice") {
          setPhase({ kind: "stage2Practice", practice: s.practice });
        }
      } else if (s.stage1) {
        if (s.stage1.passed && category === "builder") {
          if (cur.kind !== "stage1Passed") {
            setPhase({ kind: "stage1Passed", score: s.stage1.score, max: s.stage1.max });
          }
        } else if (cur.kind !== "stage1Failed") {
          setPhase({ kind: "stage1Failed", score: s.stage1.score, max: s.stage1.max });
        }
      } else if (s.examiner) {
        if (cur.kind !== "claim" && cur.kind !== "running") {
          setPhase({ kind: "claim", examiner: s.examiner });
          setTimeout(() => setPhase({ kind: "running" }), 2200);
        }
      } else {
        setPhase({ kind: "waitingExaminer" });
      }
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Ошибка загрузки" });
    }
  }, [assignmentId, category]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/calls/${assignmentId}/start`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Не удалось начать");
      setPhase({ kind: "waitingExaminer" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось начать обзвон");
    }
  }, [assignmentId]);

  const gotoStage2 = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/calls/${assignmentId}/stage2-ready`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка");
      // Практика стартует сразу — загрузим состояние
      loadState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }, [assignmentId, loadState]);

  useEffect(() => { loadState(); }, [loadState]);
  useEffect(() => {
    const t = setInterval(loadState, 4000);
    return () => clearInterval(t);
  }, [loadState]);

  if (phase.kind === "error") {
    return (
      <div className="border border-line-strong bg-panel p-8 max-w-md" role="alert">
        <p className="track mb-3">ОШИБКА</p>
        <p className="text-sm text-fog">{phase.message}</p>
        <button onClick={loadState} className="mt-6 track hover:text-paper transition-colors">
          Повторить
        </button>
      </div>
    );
  }

  if (phase.kind === "review") {
    return (
      <div className="border border-line bg-panel p-10 text-center max-w-md rise">
        <p className="track mb-4">ОБЗВОН ЗАВЕРШЁН</p>
        <p className="text-mist text-sm leading-relaxed">
          Ответы проверяются. Итог появится здесь автоматически.
        </p>
      </div>
    );
  }

  if (phase.kind === "finished") {
    return <FinishedNotice assignmentId={assignmentId} />;
  }

  if (phase.kind === "idle") {
    return (
      <div className="border border-line bg-panel p-10 text-center max-w-md rise">
        <p className="track mb-4">ГОТОВ К НАЧАЛУ</p>
        <p className="text-mist text-sm max-w-sm mx-auto leading-relaxed">
          Когда всё готово — нажмите «Начать обзвон». Проверяющий подключится к беседе.
        </p>
        <button
          onClick={start}
          className="mt-8 bg-paper text-ink px-8 py-4 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)]"
        >
          Начать обзвон
        </button>
        {error ? <p className="mt-4 text-sm text-fog">{error}</p> : null}
      </div>
    );
  }

  if (phase.kind === "waitingExaminer") {
    return (
      <div className="border border-line bg-panel p-10 text-center max-w-md rise">
        <p className="track mb-4">ОЖИДАНИЕ ПРОВЕРЯЮЩЕГО</p>
        <p className="text-2xl font-semibold tracking-tight mb-3">Вы начали обзвон</p>
        <p className="text-mist text-sm leading-relaxed">
          Как только проверяющий возьмёт ваш обзвон — вы узнаете первыми.
        </p>
        <span className="inline-flex items-center gap-3 mt-8 text-mist text-xs">
          <span
            className="w-1.5 h-1.5 rounded-full bg-fog"
            style={{ animation: "pulse-dot 1.6s ease-in-out infinite" }}
            aria-hidden
          />
          Ждём проверяющего…
        </span>
      </div>
    );
  }

  if (phase.kind === "claim") {
    return (
      <div className="w-full max-w-3xl relative">
        <div className="claim-badge claim-badge-center">
          <p className="track !text-[9px] mb-2">ВАШ ОБЗВОН ВЗЯЛ</p>
          <p className="text-xl font-semibold tracking-tight">{phase.examiner}</p>
        </div>
      </div>
    );
  }

  if (phase.kind === "stage1Passed") {
    return (
      <div className="w-full max-w-md">
        <div className="border border-paper bg-panel p-10 text-center rise">
          <p className="track mb-4 text-paper">1 ТУР ПРОЙДЕН</p>
          <p className="text-3xl font-semibold tracking-tight mb-3">
            {phase.score} баллов
          </p>
          <p className="text-mist text-sm leading-relaxed">
            Поздравляем! Вы прошли первый тур. Переходите ко второму —
            практическое задание в Roblox Studio с таймером на 1 час.
          </p>
          <button
            onClick={gotoStage2}
            className="mt-8 bg-paper text-ink px-8 py-4 text-sm font-medium hover:bg-fog hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(244,244,246,0.15)]"
          >
            Перейти ко 2 туру
          </button>
          {error ? <p className="mt-4 text-sm text-fog">{error}</p> : null}
        </div>
      </div>
    );
  }

  if (phase.kind === "stage1Failed") {
    return (
      <div className="w-full max-w-md">
        <div className="border border-line bg-panel p-10 text-center rise">
          <p className="track mb-4">1 ТУР НЕ ПРОЙДЕН</p>
          <p className="text-3xl font-semibold tracking-tight mb-3 text-mist">
            {phase.score} баллов
          </p>
          <p className="text-mist text-sm leading-relaxed">
            К сожалению, вы не набрали проходные 25 баллов. Спасибо за участие!
          </p>
          <a href="/cabinet" className="inline-block mt-8 track hover:text-paper transition-colors">
            В КАБИНЕТ →
          </a>
        </div>
      </div>
    );
  }

  if (phase.kind === "stage2Practice") {
    return <Stage2Practice practice={phase.practice} examiner={examiner} />;
  }

  // phase.kind === "running" — 1 тур
  return (
    <div className="w-full max-w-3xl relative">
      {examiner ? (
        <div className="claim-badge claim-badge-corner">
          <p className="track !text-[9px]">ВАШ ОБЗВОН ВЗЯЛ</p>
          <p className="text-sm font-semibold tracking-tight">{examiner}</p>
        </div>
      ) : null}

      <p
        className="track text-center !text-sm tracking-[0.4em] mb-10 text-fog rise"
        aria-live="polite"
      >
        ВЫ СЕЙЧАС ПРОХОДИТЕ ОБЗВОН
      </p>

      <div className="game-appear">
        <DinoGame />
      </div>

      <p className="text-center text-fog text-xs mt-8">
        Обзвон идёт. Играйте, пока проверяющий задаёт вопросы — итог появится автоматически.
      </p>
    </div>
  );
}

/** Этап 2: задание сверху + таймер-полоса по центру. */
function Stage2Practice({
  practice,
  examiner,
}: {
  practice: PracticeInfo;
  examiner: string | null;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const deadline = practice.deadline ? new Date(practice.deadline).getTime() : 0;
  const total = 60 * 60 * 1000;
  const left = Math.max(0, deadline - now);
  const progress = deadline ? Math.max(0, Math.min(1, left / total)) : 0;

  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const timeStr =
    String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

  const expired = left === 0;

  return (
    <div className="w-full max-w-3xl relative">
      {examiner ? (
        <div className="claim-badge claim-badge-corner">
          <p className="track !text-[9px]">ПРАКТИКУ ПРОВОДИТ</p>
          <p className="text-sm font-semibold tracking-tight">{examiner}</p>
        </div>
      ) : null}

      <div className="border border-line-strong bg-panel p-6 mb-6 rise">
        <p className="track !text-[9px] mb-2">ЗАДАНИЕ 2 ЭТАПА · ROBLOX STUDIO</p>
        <h2 className="text-xl font-semibold tracking-tight">{practice.title}</h2>
        <p className="text-sm text-fog mt-3 leading-relaxed">{practice.brief}</p>
        <div className="mt-4 border-t border-line pt-4">
          <p className="track !text-[9px] mb-2">ТРЕБОВАНИЯ</p>
          <ul className="space-y-1.5">
            {practice.requirements.split("\n").map((r, i) => (
              <li key={i} className="text-sm text-mist leading-relaxed">{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-line bg-panel p-8 text-center">
        <p className="track !text-[9px] mb-4">ОСТАЛОСЬ ВРЕМЕНИ</p>
        <p
          className={
            "text-5xl font-semibold tracking-tight font-mono " +
            (expired ? "text-mist" : left < 5 * 60000 ? "text-paper" : "text-fog")
          }
        >
          {expired ? "ВРЕМЯ ВЫШЛО" : timeStr}
        </p>
        <div className="mt-6 h-2 bg-ink border border-line overflow-hidden">
          <div
            className="h-full bg-paper transition-[width] duration-1000 ease-linear"
            style={{ width: progress * 100 + "%" }}
          />
        </div>
        <p className="text-mist text-xs mt-4">
          {expired
            ? "Время вышло. Покажите результат работы проверяющему — он оценит практику."
            : "Выполняйте задание в Roblox Studio. По истечении времени покажите работу проверяющему."}
        </p>
      </div>
    </div>
  );
}

function FinishedNotice({ assignmentId }: { assignmentId: string }) {
  const [info, setInfo] = useState<{ decision: string | null; score: number | null } | null>(null);

  useEffect(() => {
    fetch(`/api/calls/${assignmentId}/result`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setInfo({ decision: j.data.decision, score: j.data.score });
      })
      .catch(() => {});
  }, [assignmentId]);

  const passed = info?.decision === "approved";
  return (
    <div className="border border-line bg-panel p-10 text-center max-w-md rise">
      <p className="track mb-6">РЕЗУЛЬТАТ</p>
      {info === null ? (
        <p className="text-mist text-sm">Загрузка результата…</p>
      ) : info.decision === null ? (
        <p className="text-mist text-sm">Итог ещё не подведён.</p>
      ) : (
        <>
          <p className={"text-3xl font-semibold tracking-tight " + (passed ? "text-paper" : "text-mist")}>
            {passed ? "Вы приняты на должность" : "Вы не приняты"}
          </p>
          <p className="track mt-6 !text-sm">НАБРАНО БАЛЛОВ: {info.score ?? 0}</p>
        </>
      )}
      <a href="/cabinet" className="inline-block mt-8 track hover:text-paper transition-colors">
        В КАБИНЕТ →
      </a>
    </div>
  );
}

/** Мини-игра: раннер в стиле Chrome Dino. */
function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef({
    dinoY: 0,
    dinoVel: 0,
    obstacles: [] as { x: number; w: number; h: number; cactus: boolean }[],
    speed: 6,
    score: 0,
    frame: 0,
    groundOffset: 0,
    gameOver: false,
    started: false,
  });

  const reset = useCallback(() => {
    stateRef.current = {
      dinoY: 0,
      dinoVel: 0,
      obstacles: [],
      speed: 6,
      score: 0,
      frame: 0,
      groundOffset: 0,
      gameOver: false,
      started: true,
    };
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;
    if (!s.started) {
      reset();
      return;
    }
    if (s.dinoY === 0) s.dinoVel = -11.2;
  }, [reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800;
    const H = 240;
    const GROUND = H - 36;
    const DINO_X = 60;
    const JUMP_V = 11.2;
    const GRAVITY = 0.62;

    canvas.width = W;
    canvas.height = H;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const s = stateRef.current;

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      if (s.started && !s.gameOver) {
        s.frame++;
        if (s.dinoY < 0 || s.dinoVel !== 0) {
          s.dinoVel += GRAVITY;
          s.dinoY += s.dinoVel;
          if (s.dinoY >= 0) {
            s.dinoY = 0;
            s.dinoVel = 0;
          }
        }
        s.speed = 6 + Math.floor(s.score / 300);
        const spawnEvery = Math.max(50, 95 - Math.floor(s.score / 150));
        if (s.frame % spawnEvery === 0 && s.frame > 40) {
          const cactus = Math.random() > 0.25;
          s.obstacles.push({
            x: W + 30,
            w: cactus ? 16 + Math.random() * 10 : 24,
            h: cactus ? 28 + Math.random() * 22 : 22,
            cactus,
          });
        }
        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);
        s.score += 1;
        if (s.score % 10 === 0) setScore(s.score);
        s.groundOffset = (s.groundOffset + s.speed) % 32;

        const dinoBox = { x: DINO_X + 8, y: GROUND - 56 + s.dinoY, w: 44, h: 52 };
        for (const o of s.obstacles) {
          const oy = o.cactus ? GROUND - o.h : GROUND - 95;
          if (
            dinoBox.x + dinoBox.w - 6 > o.x &&
            dinoBox.x + 6 < o.x + o.w &&
            dinoBox.y + dinoBox.h > oy &&
            dinoBox.y < oy + o.h
          ) {
            s.gameOver = true;
            setGameOver(true);
          }
        }
      }

      ctx.strokeStyle = "#3a3a3f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();
      ctx.fillStyle = "#232326";
      for (let x = -s.groundOffset; x < W; x += 32) {
        ctx.fillRect(x, GROUND + 10, 12, 2);
        ctx.fillRect(x + 18, GROUND + 18, 8, 2);
      }

      drawTrex(ctx, DINO_X, GROUND + s.dinoY, s.started && !s.gameOver && s.dinoY === 0, s.frame);

      for (const o of s.obstacles) {
        ctx.fillStyle = "#8a8a92";
        if (o.cactus) {
          ctx.fillRect(o.x, GROUND - o.h, o.w * 0.55, o.h);
          ctx.fillRect(o.x - 5, GROUND - o.h * 0.7, 5, o.h * 0.35);
          ctx.fillRect(o.x + o.w * 0.55, GROUND - o.h * 0.8, 5, o.h * 0.4);
        } else {
          const flap = Math.floor(s.frame / 12) % 2 === 0;
          const oy = GROUND - 95;
          ctx.fillRect(o.x + 6, oy, 18, 5);
          ctx.fillRect(o.x, oy + (flap ? -6 : 4), 10, 6);
          ctx.fillRect(o.x + 20, oy - 3, 8, 5);
        }
      }

      ctx.fillStyle = "#8a8a92";
      ctx.font = "13px monospace";
      ctx.textAlign = "right";
      ctx.fillText("HI " + String(s.score).padStart(5, "0"), W - 16, 24);

      ctx.textAlign = "center";
      if (!s.started) {
        ctx.fillStyle = "#b4b4bc";
        ctx.font = "14px monospace";
        ctx.fillText("ПРОБЕЛ / КЛИК — НАЧАТЬ", W / 2, H / 2 - 20);
      }
      if (s.gameOver) {
        ctx.fillStyle = "#f4f4f6";
        ctx.font = "18px monospace";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 16);
        ctx.fillStyle = "#8a8a92";
        ctx.font = "12px monospace";
        ctx.fillText("ПРОБЕЛ / КЛИК — ЗАНОВО", W / 2, H / 2 + 8);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="border border-line bg-panel">
      <canvas
        ref={canvasRef}
        className="w-full h-auto block cursor-pointer"
        onClick={jump}
        aria-label="Мини-игра: раннер. Прыжок — пробел или клик."
        role="img"
      />
      <div className="flex items-center justify-between px-4 py-3 border-t border-line">
        <span className="track">СЧЁТ: {String(score).padStart(5, "0")}</span>
        {gameOver ? (
          <button
            onClick={reset}
            className="track hover:text-paper hover:-translate-y-px active:translate-y-0 transition-all !text-[10px]"
          >
            ЗАНОВО
          </button>
        ) : started ? (
          <span className="track !text-[10px]">ПРОБЕЛ — ПРЫЖОК</span>
        ) : null}
      </div>
    </div>
  );
}
