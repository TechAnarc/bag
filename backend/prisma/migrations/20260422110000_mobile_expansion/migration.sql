-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "fcmToken" TEXT;

-- CreateTable
CREATE TABLE "AdminDevice" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fcmToken" TEXT,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminDevice_deviceId_key" ON "AdminDevice"("deviceId");

-- CreateIndex
CREATE INDEX "AdminDevice_adminId_idx" ON "AdminDevice"("adminId");

-- AddForeignKey
ALTER TABLE "AdminDevice" ADD CONSTRAINT "AdminDevice_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
