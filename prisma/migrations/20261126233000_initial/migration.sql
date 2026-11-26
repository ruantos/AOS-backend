CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('ATTENDANT', 'COURIER');

CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'PREPARING', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED');

CREATE TYPE "DeliveryStatus" AS ENUM ('ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');

CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "street" VARCHAR(200) NOT NULL,
    "number" VARCHAR(30) NOT NULL,
    "complement" VARCHAR(200),
    "neighborhood" VARCHAR(120) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "reference" VARCHAR(300),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000),
    "price" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "notes" VARCHAR(1000),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Delivery" (
    "id" UUID NOT NULL,
    "trackingCode" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "courierId" UUID,
    "addressSnapshot" JSONB NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "failureNote" VARCHAR(1000),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatusHistory" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "deliveryId" UUID,
    "changedById" UUID NOT NULL,
    "orderStatus" "OrderStatus",
    "deliveryStatus" "DeliveryStatus",
    "note" VARCHAR(1000),
    "changedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE INDEX "Customer_createdById_deletedAt_idx" ON "Customer"("createdById", "deletedAt");

CREATE INDEX "Product_createdById_deletedAt_idx" ON "Product"("createdById", "deletedAt");

CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

CREATE INDEX "Order_createdById_deletedAt_status_createdAt_idx" ON "Order"("createdById", "deletedAt", "status", "createdAt");

CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE UNIQUE INDEX "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

CREATE UNIQUE INDEX "Delivery_trackingCode_key" ON "Delivery"("trackingCode");

CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

CREATE INDEX "Delivery_courierId_deletedAt_status_idx" ON "Delivery"("courierId", "deletedAt", "status");

CREATE INDEX "StatusHistory_orderId_changedAt_idx" ON "StatusHistory"("orderId", "changedAt");

CREATE INDEX "StatusHistory_deliveryId_idx" ON "StatusHistory"("deliveryId");

CREATE INDEX "StatusHistory_changedById_idx" ON "StatusHistory"("changedById");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_price_nonnegative" CHECK ("price" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unitPrice_nonnegative" CHECK ("unitPrice" >= 0);
ALTER TABLE "Session" ADD CONSTRAINT "Session_expiry_valid" CHECK ("expiresAt" > "createdAt");
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_event_valid" CHECK (
  ("orderStatus" IS NOT NULL AND "deliveryStatus" IS NULL AND "deliveryId" IS NULL)
  OR ("orderStatus" IS NULL AND "deliveryStatus" IS NOT NULL AND "deliveryId" IS NOT NULL)
);
