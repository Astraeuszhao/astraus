-- Rename physical tables from legacy names to astraeus_*
ALTER TABLE "snapshare_user" RENAME TO "astraeus_user";
ALTER TABLE "snapshare_image" RENAME TO "astraeus_image";
ALTER TABLE "snapshare_image_like" RENAME TO "astraeus_image_like";
ALTER TABLE "snapshare_follow" RENAME TO "astraeus_follow";
