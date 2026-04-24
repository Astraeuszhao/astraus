-- AlterTable
ALTER TABLE "snapshare_image" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
