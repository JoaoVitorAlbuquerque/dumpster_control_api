-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_account_id_fkey";

-- DropIndex
DROP INDEX "requests_cpf_key";

-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "account_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
