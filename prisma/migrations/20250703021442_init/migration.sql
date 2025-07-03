-- CreateEnum
CREATE TYPE "FilterType" AS ENUM ('RANGE', 'NUMBER', 'LABEL');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterDef" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FilterType" NOT NULL,
    "units" TEXT,

    CONSTRAINT "FilterDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryFilter" (
    "categoryId" INTEGER NOT NULL,
    "filterId" INTEGER NOT NULL,

    CONSTRAINT "CategoryFilter_pkey" PRIMARY KEY ("categoryId","filterId")
);

-- CreateTable
CREATE TABLE "Product" (
    "barcode" BIGINT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "qtyInStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("barcode")
);

-- CreateTable
CREATE TABLE "ProductFilterValue" (
    "productId" BIGINT NOT NULL,
    "filterId" INTEGER NOT NULL,
    "rangeFrom" DOUBLE PRECISION,
    "rangeTo" DOUBLE PRECISION,
    "numberVal" INTEGER,
    "labelVal" TEXT,

    CONSTRAINT "ProductFilterValue_pkey" PRIMARY KEY ("productId","filterId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFulfilled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderId" INTEGER NOT NULL,
    "productId" BIGINT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "ProductFilterValue_filterId_rangeFrom_rangeTo_idx" ON "ProductFilterValue"("filterId", "rangeFrom", "rangeTo");

-- CreateIndex
CREATE INDEX "Order_isFulfilled_idx" ON "Order"("isFulfilled");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "FilterDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilterValue" ADD CONSTRAINT "ProductFilterValue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("barcode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilterValue" ADD CONSTRAINT "ProductFilterValue_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "FilterDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("barcode") ON DELETE RESTRICT ON UPDATE CASCADE;
