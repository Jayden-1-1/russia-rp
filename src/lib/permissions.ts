/**
 * Возможности сайта (не роли!).
 * Локальные роли сопоставляются с этими возможностями через матрицу доступа.
 */

export const CAPABILITIES = [
  { id: "cabinet.view", label: "Просмотр личного кабинета", default: true },
  { id: "calls.view", label: "Доступ к обзвонам", default: false },
  { id: "calls.take", label: "Прохождение обзвона", default: false },
  { id: "calls.create", label: "Назначение обзвонов", default: false },
  { id: "questions.manage", label: "Управление вопросами", default: false },
  { id: "results.view", label: "Просмотр результатов", default: false },
  { id: "results.grade", label: "Оценивание ответов", default: false },
  { id: "candidates.manage", label: "Управление кандидатами", default: false },
  { id: "profiles.manage", label: "Создание профилей и выдача ролей", default: false },
  { id: "keys.manage", label: "Создание ключей-приглашений", default: false },
  { id: "roles.manage", label: "Управление ролями сайта", default: false },
  { id: "admin.panel", label: "Доступ к административной панели", default: false },
] as const;

export type Capability = (typeof CAPABILITIES)[number]["id"];

export const CAPABILITY_IDS: string[] = CAPABILITIES.map((c) => c.id);

export function isValidCapability(id: string): id is Capability {
  return CAPABILITY_IDS.includes(id);
}
