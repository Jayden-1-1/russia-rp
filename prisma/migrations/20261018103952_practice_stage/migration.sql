-- CreateTable
CREATE TABLE "PracticeTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'builder',
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "timeLimitMin" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CallSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "examinerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stage" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "cancelReason" TEXT,
    "currentOrder" INTEGER NOT NULL DEFAULT 1,
    "practiceTaskId" TEXT,
    "practiceStartedAt" DATETIME,
    "practiceDeadlineAt" DATETIME,
    "stage2ReadyAt" DATETIME,
    CONSTRAINT "CallSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CallAssignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CallSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CallTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CallSession_examinerId_fkey" FOREIGN KEY ("examinerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CallSession_practiceTaskId_fkey" FOREIGN KEY ("practiceTaskId") REFERENCES "PracticeTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CallSession" ("assignmentId", "cancelReason", "currentOrder", "examinerId", "finishedAt", "id", "startedAt", "status", "templateId") SELECT "assignmentId", "cancelReason", "currentOrder", "examinerId", "finishedAt", "id", "startedAt", "status", "templateId" FROM "CallSession";
DROP TABLE "CallSession";
ALTER TABLE "new_CallSession" RENAME TO "CallSession";
CREATE INDEX "CallSession_assignmentId_idx" ON "CallSession"("assignmentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
