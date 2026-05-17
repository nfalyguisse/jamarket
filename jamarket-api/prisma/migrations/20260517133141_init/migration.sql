-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('essence', 'diesel', 'electrique', 'hybride');

-- CreateEnum
CREATE TYPE "RightEnum" AS ENUM ('CREATE_AD', 'DELETE_AD', 'MANAGE_USER', 'CUSTOMER', 'ADMIN');

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "rights" "RightEnum"[],
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role_id" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "brand_id" INTEGER NOT NULL,

    CONSTRAINT "model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicule_type" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "vehicule_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicule" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "kilometer" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "doors_number" INTEGER NOT NULL,
    "power" TEXT NOT NULL,
    "fuel" "FuelType" NOT NULL,
    "color" TEXT NOT NULL,
    "vehicule_year" INTEGER NOT NULL,
    "vehicule_type_id" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "vehicule_id" INTEGER NOT NULL,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "vehicule_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_sold" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ad_id" INTEGER NOT NULL,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" SERIAL NOT NULL,
    "ad_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat" (
    "id" SERIAL NOT NULL,
    "ad_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_mode" (
    "id" SERIAL NOT NULL,
    "display_name" TEXT NOT NULL,

    CONSTRAINT "display_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme" (
    "id" SERIAL NOT NULL,
    "primary_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "main_logo" TEXT NOT NULL,
    "secondary_logo" TEXT NOT NULL,
    "display_mode_id" INTEGER NOT NULL,

    CONSTRAINT "theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ad_vehicule_id_key" ON "ad"("vehicule_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_user_id_ad_id_key" ON "favorite"("user_id", "ad_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model" ADD CONSTRAINT "model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_vehicule_type_id_fkey" FOREIGN KEY ("vehicule_type_id") REFERENCES "vehicule_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_vehicule_id_fkey" FOREIGN KEY ("vehicule_id") REFERENCES "vehicule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad" ADD CONSTRAINT "ad_vehicule_id_fkey" FOREIGN KEY ("vehicule_id") REFERENCES "vehicule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat" ADD CONSTRAINT "stat_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme" ADD CONSTRAINT "theme_display_mode_id_fkey" FOREIGN KEY ("display_mode_id") REFERENCES "display_mode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
