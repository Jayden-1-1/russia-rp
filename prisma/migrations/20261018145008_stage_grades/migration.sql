-- CreateTable
CREATE TABLE "StageGrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "examinerId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StageGrade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CallSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StageGrade_examinerId_fkey" FOREIGN KEY ("examinerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StageGrade_sessionId_stage_key" ON "StageGrade"("sessionId", "stage");
