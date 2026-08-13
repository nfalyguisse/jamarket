-- AlterTable
ALTER TABLE "ad" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: annonces déjà soft-deleted
UPDATE "ad" SET "is_archived" = true WHERE "deleted_at" IS NOT NULL;
