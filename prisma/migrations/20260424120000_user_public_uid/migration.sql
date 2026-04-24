-- AlterTable
ALTER TABLE "snapshare_user" ADD COLUMN "publicUid" TEXT;

CREATE UNIQUE INDEX "snapshare_user_publicUid_key" ON "snapshare_user"("publicUid");
