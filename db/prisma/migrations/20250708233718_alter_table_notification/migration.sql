/*
  Warnings:

  - You are about to drop the column `is_read` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "is_read",
ADD COLUMN     "is_sent" BOOLEAN NOT NULL DEFAULT false;
