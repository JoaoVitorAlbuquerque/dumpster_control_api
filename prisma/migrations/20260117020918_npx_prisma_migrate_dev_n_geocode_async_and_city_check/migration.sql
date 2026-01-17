-- CreateEnum
CREATE TYPE "GeocodeStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "address_formatted" TEXT,
ADD COLUMN     "geocode_error" TEXT,
ADD COLUMN     "geocode_provider" TEXT,
ADD COLUMN     "geocode_relevance" DOUBLE PRECISION,
ADD COLUMN     "geocode_status" "GeocodeStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "geocoded_at" TIMESTAMP(3),
ADD COLUMN     "inside_city" BOOLEAN,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;
