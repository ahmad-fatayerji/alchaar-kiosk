-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_isCancelled_idx" ON "Order"("isCancelled");
