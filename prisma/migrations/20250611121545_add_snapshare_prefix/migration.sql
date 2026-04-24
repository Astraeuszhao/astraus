/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_userId_fkey";

-- DropTable
DROP TABLE "Image";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "snapshare_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshare_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshare_image" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshare_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snapshare_user_email_key" ON "snapshare_user"("email");

-- AddForeignKey
ALTER TABLE "snapshare_image" ADD CONSTRAINT "snapshare_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "snapshare_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
