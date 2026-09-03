-- CreateEnum
CREATE TYPE "TestimonialMediaType" AS ENUM ('NONE', 'PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "author_name" TEXT NOT NULL,
    "occasion" TEXT,
    "quote" TEXT,
    "media_type" "TestimonialMediaType" NOT NULL DEFAULT 'NONE',
    "media_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonials_active_idx" ON "testimonials"("active");
