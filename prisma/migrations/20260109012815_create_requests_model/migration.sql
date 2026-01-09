-- CreateEnum
CREATE TYPE "activities" AS ENUM ('CLEANING', 'TREE', 'CONSTRUCTION', 'GROUND');

-- CreateEnum
CREATE TYPE "priorities" AS ENUM ('LOW', 'HIGH');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "requests" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "protocol" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "activity" "activities" NOT NULL,
    "priority" "priorities" NOT NULL DEFAULT 'LOW',
    "status" "status" NOT NULL DEFAULT 'REQUESTED',
    "description" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" TIMESTAMP(3),
    "estimated_end_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requests_protocol_key" ON "requests"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "requests_cpf_key" ON "requests"("cpf");

-- CreateIndex
CREATE INDEX "requests_cpf_idx" ON "requests"("cpf");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_priority_idx" ON "requests"("priority");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
