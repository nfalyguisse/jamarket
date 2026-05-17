-- AlterTable
ALTER TABLE "ad" ADD COLUMN     "seller_id" INTEGER;

-- AddForeignKey
ALTER TABLE "ad" ADD CONSTRAINT "ad_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
