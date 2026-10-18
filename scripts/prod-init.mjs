/**
 * Инициализация production БД (идемпотентно):
 * миграции применяются на этапе сборки, здесь — роли, шаблоны, практика, root-админ.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return "scrypt:" + salt.toString("base64url") + ":" + hash.toString("base64url");
}

const ROLES = [
  ["Кандидат", ["cabinet.view", "calls.view", "calls.take"]],
  ["Куратор обзвонов", ["cabinet.view", "calls.view", "results.view", "results.grade", "candidates.manage"]],
  ["Администратор игры", ["cabinet.view", "calls.view", "results.view", "candidates.manage", "profiles.manage", "keys.manage"]],
  ["Билдер-скриптер", ["cabinet.view", "calls.view", "calls.take"]],
];

// Практические задания (2 тур, билдер-скриптер)
const PRACTICE = [
  {
    name: "Практика Вариант 1",
    title: "Интерактивный магазин с сохранением",
    brief:
      "Создай в Roblox Studio небольшой магазин: стойка, витрина с 3 предметами и NPC-продавец. " +
      "Игрок подходит, видит интерфейс с ценами, покупает предмет за игровую валюту. " +
      "Купленное должно сохраняться после перезахода в игру.",
    requirements:
      "1. Магазин: стойка + 3 витрины с предметами (Parts/Models)\n" +
      "2. Покупка через ProximityPrompt или клик по предмету\n" +
      "3. GUI с ценами и кнопкой покупки (универсальный для ПК и телефона)\n" +
      "4. Проверка валюты и списание — на сервере\n" +
      "5. Сохранение купленных предметов через DataStore\n" +
      "6. Защита от повторной покупки одного предмета",
  },
  {
    name: "Практика Вариант 2",
    title: "Система квестов с наградами",
    brief:
      "Сделай мини-систему квестов: 3 простых задания (собрать 5 предметов, дойти до точки, нажать 3 кнопки). " +
      "Прогресс виден игроку в интерфейсе, за каждый квест — награда валютой, за все три — бонус. " +
      "Прогресс сохраняется между сессиями.",
    requirements:
      "1. Три квеста с разными условиями выполнения\n" +
      "2. Отслеживание прогресса на сервере (не подделать клиентом)\n" +
      "3. GUI со списком квестов и прогрессом каждого\n" +
      "4. Награда за квест + бонус за все три\n" +
      "5. Сохранение прогресса квестов через DataStore\n" +
      "6. Награду нельзя получить дважды за один квест",
  },
  {
    name: "Практика Вариант 3",
    title: "Локация с анимацией и механикой",
    brief:
      "Построй игровую зону: комната/двор с дверью, которая плавно открывается при подходе, " +
      "поднимающейся платформой (лифт) и светящейся кнопкой. Нажатие кнопки запускает лифт, " +
      "дверь с анимацией TweenService, всё должно работать для нескольких игроков одновременно.",
    requirements:
      "1. Дверь с плавной анимацией открытия (TweenService)\n" +
      "2. Кнопка (Part или ProximityPrompt) с эффектом нажатия\n" +
      "3. Платформа-лифт, поднимающая игрока вверх\n" +
      "4. Механика синхронизирована на сервере для всех игроков\n" +
      "5. Освещение и детали оформления локации\n" +
      "6. Перезапуск механики после использования (дверь закрывается, лифт возвращается)",
  },
];

async function main() {
  for (const [name, caps] of ROLES) {
    const role =
      (await prisma.role.findFirst({ where: { name } })) ??
      (await prisma.role.create({ data: { name } }));
    for (const cap of caps) {
      const existing = await prisma.rolePermission.findFirst({
        where: { roleId: role.id, capability: cap },
      });
      if (!existing) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, capability: cap, allowed: true },
        });
      }
    }
    console.log("role ok:", name);
  }

  for (const t of PRACTICE) {
    const existing = await prisma.practiceTask.findFirst({ where: { name: t.name } });
    if (existing) {
      await prisma.practiceTask.update({
        where: { id: existing.id },
        data: { ...t, category: "builder", isActive: true },
      });
    } else {
      await prisma.practiceTask.create({
        data: { ...t, category: "builder", timeLimitMin: 60 },
      });
    }
    console.log("practice ok:", t.name);
  }

  // Root-админ
  const login = process.env.ROOT_LOGIN ?? "admin";
  const password = process.env.ROOT_PASSWORD ?? "admin123";
  const rootUser = await prisma.user.findUnique({ where: { login } });
  if (!rootUser) {
    await prisma.user.create({
      data: {
        login,
        displayName: "Главный администратор",
        position: "Главный администратор",
        passwordHash: hashPassword(password),
        isRootAdmin: true,
      },
    });
    console.log("root admin created:", login);
  } else {
    // Пересоздаём хеш (исправляет записанных с другим форматом)
    await prisma.user.update({
      where: { id: rootUser.id },
      data: { isRootAdmin: true, passwordHash: hashPassword(password) },
    });
    console.log("root admin ok (hash refreshed):", login);
  }

  console.log("prod-init done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
