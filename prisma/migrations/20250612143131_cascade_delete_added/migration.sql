-- DropForeignKey
ALTER TABLE "snapshare_follow" DROP CONSTRAINT "snapshare_follow_followerId_fkey";

-- DropForeignKey
ALTER TABLE "snapshare_follow" DROP CONSTRAINT "snapshare_follow_followingId_fkey";

-- DropForeignKey
ALTER TABLE "snapshare_image" DROP CONSTRAINT "snapshare_image_userId_fkey";

-- DropForeignKey
ALTER TABLE "snapshare_image_like" DROP CONSTRAINT "snapshare_image_like_imageId_fkey";

-- DropForeignKey
ALTER TABLE "snapshare_image_like" DROP CONSTRAINT "snapshare_image_like_userId_fkey";

-- AddForeignKey
ALTER TABLE "snapshare_image" ADD CONSTRAINT "snapshare_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "snapshare_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_image_like" ADD CONSTRAINT "snapshare_image_like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "snapshare_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_image_like" ADD CONSTRAINT "snapshare_image_like_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "snapshare_image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_follow" ADD CONSTRAINT "snapshare_follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "snapshare_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshare_follow" ADD CONSTRAINT "snapshare_follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "snapshare_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
