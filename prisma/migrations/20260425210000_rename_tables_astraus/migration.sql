-- Align physical table names with Astraus branding (astraus_*)
ALTER TABLE "astraeus_user" RENAME TO "astraus_user";
ALTER TABLE "astraeus_image" RENAME TO "astraus_image";
ALTER TABLE "astraeus_image_like" RENAME TO "astraus_image_like";
ALTER TABLE "astraeus_follow" RENAME TO "astraus_follow";
