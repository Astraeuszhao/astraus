/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `snapshare_user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `snapshare_user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "snapshare_user" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "snapshare_user_username_key" ON "snapshare_user"("username");
