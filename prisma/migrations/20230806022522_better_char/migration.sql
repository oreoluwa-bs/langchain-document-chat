/*
  Warnings:

  - You are about to alter the column `content` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40000)`.

*/
-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "content" SET DATA TYPE VARCHAR(40000);
