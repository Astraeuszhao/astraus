-- CreateTable
CREATE TABLE "snapshare_image_like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshare_image_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshare_follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshare_follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snapshare_image_like_userId_imageId_key" ON "snapshare_image_like"("userId", "imageId");

-- CreateIndex
CREATE UNIQUE INDEX "snapshare_follow_followerId_followingId_key" ON "snapshare_follow"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "snapshare_image_like" ADD CONSTRAINT "snapshare_image_like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "snapshare_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_image_like" ADD CONSTRAINT "snapshare_image_like_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "snapshare_image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_follow" ADD CONSTRAINT "snapshare_follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "snapshare_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_follow" ADD CONSTRAINT "snapshare_follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "snapshare_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
