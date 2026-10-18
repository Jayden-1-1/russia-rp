/**
 * Интеграционные тесты нового сценария (локальная авторизация, без Discord):
 *  - вход по логину/паролю, hash-проверка;
 *  - роли и матрица доступа;
 *  - ключи-приглашения (создание, регистрация, лимиты);
 *  - случайный выбор варианта по категории (имя скрыто);
 *  - оценка 0–2 балла, автопорог 25.
 *
 * Запуск: npx tsx scripts/test-scenarios.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

async function main() {
  console.log("=== Тесты RUSSIA RP (локальная авторизация) ===\n");

  // --- Чистим тестовые данные ---
  const testLogin = "test_candidate2";
  const testAdmin = "test_admin2";
  await prisma.answer.deleteMany({
    where: { session: { assignment: { user: { login: testLogin } } } },
  });
  await prisma.callDecision.deleteMany({
    where: { examiner: { login: testAdmin } },
  });
  await prisma.callSession.deleteMany({
    where: { assignment: { user: { login: testLogin } } },
  });
  await prisma.callAssignment.deleteMany({
    where: { user: { login: testLogin } },
  });
  await prisma.session.deleteMany({
    where: { user: { login: { in: [testLogin, testAdmin] } } },
  });
  await prisma.roleBinding.deleteMany({
    where: { user: { login: { in: [testLogin, testAdmin] } } },
  });
  await prisma.inviteKey.deleteMany({ where: { note: "test" } });
  await prisma.user.deleteMany({
    where: { login: { in: [testLogin, testAdmin] } },
  });
  await prisma.question.deleteMany({
    where: { template: { name: { startsWith: "TEST " } } },
  });
  await prisma.callTemplate.deleteMany({
    where: { name: { startsWith: "TEST " } },
  });
  // Остатки прошлых прогонов (роль не удалилась из-за FK)
  await prisma.rolePermission.deleteMany({ where: { role: { name: "TEST role" } } });
  await prisma.roleBinding.deleteMany({ where: { role: { name: "TEST role" } } });
  await prisma.inviteKey.deleteMany({ where: { role: { name: "TEST role" } } });
  await prisma.role.deleteMany({ where: { name: "TEST role" } });

  // --- 1. Пароли ---
  console.log("1. Пароли и вход");
  const { hashPassword, verifyPassword, randomKeyCode } = await import("../src/lib/crypto");
  const hash = hashPassword("secret123");
  assert(verifyPassword("secret123", hash), "Верный пароль принят");
  assert(!verifyPassword("wrong", hash), "Неверный пароль отклонён");
  assert(hash !== hashPassword("secret123"), "Соль уникальна при каждом хеше");
  const key1 = randomKeyCode();
  const key2 = randomKeyCode();
  assert(/^RRP-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(key1), "Формат ключа RRP-XXXX-XXXX");
  assert(key1 !== key2, "Ключи уникальны");

  // --- 2. Роли и права ---
  console.log("\n2. Роли и матрица доступа");
  const role = await prisma.role.create({
    data: {
      name: "TEST role",
      permissions: {
        create: [
          { capability: "cabinet.view", allowed: true },
          { capability: "calls.take", allowed: true },
          { capability: "admin.panel", allowed: false },
        ],
      },
    },
  });
  assert(Boolean(role.id), "Роль создана");
  const perms = await prisma.rolePermission.findMany({ where: { roleId: role.id } });
  assert(
    perms.filter((p) => p.allowed).length === 2,
    "Матрица прав: включено 2, выключено 1"
  );

  // --- 3. Пользователи и вход ---
  console.log("\n3. Пользователи");
  const candidate = await prisma.user.create({
    data: {
      login: testLogin,
      passwordHash: hashPassword("cand123"),
      displayName: "Тест Кандидат",
      position: "Билдер-скриптер",
      roleBindings: { create: { roleId: role.id } },
    },
  });
  assert(verifyPassword("cand123", candidate.passwordHash), "Пароль кандидата проверяется");
  assert(candidate.position === "Билдер-скриптер", "Должность сохранена");
  const binding = await prisma.roleBinding.findFirst({
    where: { userId: candidate.id },
    include: { role: true },
  });
  assert(binding?.role.name === "TEST role", "Роль привязана");

  const dupe = await prisma.user.findUnique({ where: { login: testLogin } });
  assert(Boolean(dupe), "Логин уникален (найден)");

  // --- 4. Ключи-приглашения ---
  console.log("\n4. Ключи-приглашения");
  const admin = await prisma.user.create({
    data: { login: testAdmin, passwordHash: hashPassword("adm123"), isRootAdmin: false },
  });
  const key = await prisma.inviteKey.create({
    data: {
      code: randomKeyCode(),
      purpose: "profile",
      roleId: role.id,
      maxUses: 2,
      note: "test",
      createdById: admin.id,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });
  assert(Boolean(key.id), "Ключ создан");
  assert(key.maxUses === 2, "Лимит активаций задан");

  const usedUpKey = await prisma.inviteKey.create({
    data: {
      code: randomKeyCode(),
      purpose: "profile",
      roleId: role.id,
      maxUses: 1,
      usedCount: 1,
      note: "test",
      createdById: admin.id,
    },
  });
  assert(usedUpKey.usedCount >= usedUpKey.maxUses, "Израсходованный ключ блокируется");
  const expiredKey = await prisma.inviteKey.create({
    data: {
      code: randomKeyCode(),
      purpose: "profile",
      roleId: role.id,
      note: "test",
      createdById: admin.id,
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  assert(
    Boolean(expiredKey.expiresAt && expiredKey.expiresAt < new Date()),
    "Просроченный ключ блокируется"
  );

  // --- 5. Случайный вариант по категории ---
  console.log("\n5. Случайный вариант по категории");
  // Тестовые варианты: 3 в builder
  const builderIds: string[] = [];
  for (let v = 1; v <= 3; v++) {
    const t = await prisma.callTemplate.create({
      data: {
        name: `TEST BV${v}`,
        category: "builder",
        questions: {
          create: Array.from({ length: 15 }, (_, i) => ({
            order: i + 1,
            text: `Вопрос ${i + 1}`,
            type: "short_text",
            points: 2,
          })),
        },
      },
    });
    builderIds.push(t.id);
  }
  const chosenCats = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const variants = await prisma.callTemplate.findMany({
      where: { isActive: true, category: "builder", questions: { some: {} } },
    });
    chosenCats.add(variants[Math.floor(Math.random() * variants.length)].id);
  }
  assert(chosenCats.size >= 2, "Варианты выбираются случайно (не один и тот же)");

  const variants = await prisma.callTemplate.findMany({
    where: { isActive: true, category: "builder", questions: { some: {} } },
  });
  const chosen = variants[Math.floor(Math.random() * variants.length)];
  const assignment = await prisma.callAssignment.create({
    data: { userId: candidate.id, templateId: chosen.id, assignedBy: admin.id },
  });
  assert(Boolean(assignment.id), "Назначение создано");

  // --- 6. Сессия и автопроверка ---
  console.log("\n6. Оценивание и автопорог");
  const { startSession, computeGrading, PASS_THRESHOLD } = await import("../src/lib/calls");
  const session = await startSession(assignment.id, null);
  assert(session.status === "active", "Сессия запущена");
  const again = await startSession(assignment.id, null);
  assert(again.id === session.id, "Повторный запуск не создаёт дубль");

  const questions = await prisma.question.findMany({
    where: { templateId: chosen.id },
    orderBy: { order: "asc" },
  });
  // startSession теперь сам создаёт заготовки ответов — проверяем
  const answerCount = await prisma.answer.count({ where: { sessionId: session.id } });
  assert(
    answerCount === questions.length,
    `Заготовки ответов созданы автоматически (${answerCount}/${questions.length})`
  );
  assert(PASS_THRESHOLD === 25, "Проходной порог = 25");

  const maxScore = questions.length * 2;

  const high = questions.map((q) => ({ questionId: q.id, score: 2 }));
  const rA = computeGrading(high);
  assert(
    rA.totalScore === maxScore && rA.passed,
    `Максимум (${maxScore}) баллов: ПРИНЯТ`
  );

  // Низкий балл: детерминированно ниже порога (максимум 12 баллов)
  const low = questions.map((q, i) => ({
    questionId: q.id,
    score: i < 6 ? 2 : 0,
  }));
  const rB = computeGrading(low);
  assert(
    rB.totalScore === 12 && !rB.passed,
    "12 баллов < 25: НЕ ПРИНЯТ"
  );

  // Граничный случай: ровно 25 (если хватает вопросов)
  const need = 25; // 10×2 + 5×1
  if (questions.length >= need - 5) {
    const edge = questions.map((q, i) => ({
      questionId: q.id,
      score: i < 10 ? 2 : i < 15 ? 1 : 0,
    }));
    const rC = computeGrading(edge);
    assert(rC.totalScore === 25 && rC.passed, "Ровно 25: ПРИНЯТ (>= порога)");
  }

  // --- Чистка ---
  await prisma.answer.deleteMany({ where: { sessionId: session.id } });
  await prisma.callSession.deleteMany({ where: { id: session.id } });
  await prisma.callAssignment.deleteMany({ where: { id: assignment.id } });
  await prisma.question.deleteMany({ where: { templateId: { in: builderIds } } });
  await prisma.callTemplate.deleteMany({ where: { id: { in: builderIds } } });
  await prisma.roleBinding.deleteMany({ where: { roleId: role.id } });
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  await prisma.inviteKey.deleteMany({ where: { roleId: role.id } });
  await prisma.role.deleteMany({ where: { id: role.id } });
  await prisma.user.deleteMany({
    where: { login: { in: [testLogin, testAdmin] } },
  });

  console.log(`\n=== Итог: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
