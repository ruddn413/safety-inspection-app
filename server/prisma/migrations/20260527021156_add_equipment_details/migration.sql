/*
  Warnings:

  - You are about to drop the column `type` on the `Equipment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "categoryMain" TEXT,
    "categorySub" TEXT,
    "categoryDetail" TEXT,
    "specification" TEXT,
    "capacity" TEXT,
    "manufacturingNum" TEXT,
    "recentPassNum" TEXT,
    "certificationNum" TEXT,
    "lastInspectionDate" DATETIME,
    "nextInspectionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("createdAt", "factoryId", "id", "lastInspectionDate", "name", "nextInspectionDate", "status", "updatedAt") SELECT "createdAt", "factoryId", "id", "lastInspectionDate", "name", "nextInspectionDate", "status", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
