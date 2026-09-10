/*
  Warnings:

  - You are about to drop the column `fraudScore` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `blockedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `blockedBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ProfileSecurity` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('REGISTER', 'LOGIN', 'RESET', 'TWO_FACTOR', 'CHANGE_PHONE', 'CHANGE_EMAIL');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED', 'USED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('CUSTOMER_SUPPORT', 'TRUST_SECURITY', 'COMMERCE_ADVISORY', 'ADMIN_COPILOT');

-- CreateEnum
CREATE TYPE "AgentMessageRole" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AgentMessageKind" AS ENUM ('QUESTION', 'ANSWER', 'REASONING', 'PROPOSAL');

-- DropForeignKey
ALTER TABLE "ProfileSecurity" DROP CONSTRAINT "ProfileSecurity_profileId_fkey";

-- DropIndex
DROP INDEX "User_tenantId_idx";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "gender" TEXT DEFAULT 'UNISEX';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "fraudScore",
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "riskReport" JSONB,
ADD COLUMN     "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "basePrice" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "gender" TEXT DEFAULT 'UNISEX',
ADD COLUMN     "sellingPrice" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "blockedAt",
DROP COLUMN "blockedBy",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "ProfileSecurity";

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "otpHash" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lastResentAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSecurity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferred2FAMethod" TEXT DEFAULT 'EMAIL',
    "backupCodes" JSONB,
    "lastPasswordChangedAt" TIMESTAMP(3),
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSecurityCheckAt" TIMESTAMP(3),
    "trustedDevices" JSONB,

    CONSTRAINT "UserSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEventLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "correlationId" TEXT,
    "actor" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIntelligence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "ltv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aov" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL DEFAULT 1,
    "productViewsCount" INTEGER NOT NULL DEFAULT 0,
    "cartAdditions" INTEGER NOT NULL DEFAULT 0,
    "checkoutAttempts" INTEGER NOT NULL DEFAULT 0,
    "abandonedCarts" INTEGER NOT NULL DEFAULT 0,
    "conversionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustIndex" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lifecycleStage" TEXT NOT NULL DEFAULT 'NEW',
    "categoryAffinity" JSONB,
    "behavioralSignals" JSONB,
    "confidenceBands" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "payload" JSONB,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "capabilities" JSONB NOT NULL,
    "supportedPincodes" JSONB,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "apiUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgDeliveryDays" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "labelUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MANIFESTED',
    "weight" DOUBLE PRECISION,
    "dimensions" JSONB,
    "manifestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedAt" TIMESTAMP(3),
    "expectedDeliveryAt" TIMESTAMP(3),
    "actualDeliveryAt" TIMESTAMP(3),
    "waybill" TEXT,
    "manifestId" TEXT,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB NOT NULL,
    "thresholds" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousDecision" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "triggerSignal" TEXT NOT NULL,
    "triggerPayload" JSONB,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "impactLevel" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "actionTaken" TEXT NOT NULL,
    "actionResponse" JSONB,
    "errorMessage" TEXT,
    "correlationId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overriddenBy" TEXT,
    "overrideReason" TEXT,
    "executedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutonomousDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "adminId" TEXT,
    "agentType" "AgentType" NOT NULL,
    "topic" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "AgentMessageRole" NOT NULL,
    "kind" "AgentMessageKind" NOT NULL,
    "content" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProposal" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "targetEntityId" TEXT,
    "suggestedAction" TEXT NOT NULL,
    "rationale" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adeDecisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAddress_userId_idx" ON "UserAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpSession_requestId_key" ON "OtpSession"("requestId");

-- CreateIndex
CREATE INDEX "OtpSession_email_idx" ON "OtpSession"("email");

-- CreateIndex
CREATE INDEX "OtpSession_phone_idx" ON "OtpSession"("phone");

-- CreateIndex
CREATE INDEX "OtpSession_status_idx" ON "OtpSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurity_userId_key" ON "UserSecurity"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DomainEventLog_eventId_key" ON "DomainEventLog"("eventId");

-- CreateIndex
CREATE INDEX "DomainEventLog_eventType_idx" ON "DomainEventLog"("eventType");

-- CreateIndex
CREATE INDEX "DomainEventLog_correlationId_idx" ON "DomainEventLog"("correlationId");

-- CreateIndex
CREATE INDEX "DomainEventLog_occurredAt_idx" ON "DomainEventLog"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserIntelligence_userId_key" ON "UserIntelligence"("userId");

-- CreateIndex
CREATE INDEX "UserIntelligence_userId_idx" ON "UserIntelligence"("userId");

-- CreateIndex
CREATE INDEX "UserIntelligence_lifecycleStage_idx" ON "UserIntelligence"("lifecycleStage");

-- CreateIndex
CREATE INDEX "UserIntelligence_riskScore_idx" ON "UserIntelligence"("riskScore");

-- CreateIndex
CREATE INDEX "UserIntelligence_ltv_idx" ON "UserIntelligence"("ltv");

-- CreateIndex
CREATE INDEX "BehavioralEvent_userId_eventType_idx" ON "BehavioralEvent"("userId", "eventType");

-- CreateIndex
CREATE INDEX "BehavioralEvent_occurredAt_idx" ON "BehavioralEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsPartner_name_key" ON "LogisticsPartner"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsPartner_code_key" ON "LogisticsPartner"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_partnerId_idx" ON "Shipment"("partnerId");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionPolicy_name_key" ON "DecisionPolicy"("name");

-- CreateIndex
CREATE INDEX "DecisionPolicy_category_idx" ON "DecisionPolicy"("category");

-- CreateIndex
CREATE INDEX "DecisionPolicy_isActive_idx" ON "DecisionPolicy"("isActive");

-- CreateIndex
CREATE INDEX "AutonomousDecision_policyId_idx" ON "AutonomousDecision"("policyId");

-- CreateIndex
CREATE INDEX "AutonomousDecision_status_idx" ON "AutonomousDecision"("status");

-- CreateIndex
CREATE INDEX "AutonomousDecision_correlationId_idx" ON "AutonomousDecision"("correlationId");

-- CreateIndex
CREATE INDEX "AutonomousDecision_entityId_idx" ON "AutonomousDecision"("entityId");

-- CreateIndex
CREATE INDEX "AutonomousDecision_createdAt_idx" ON "AutonomousDecision"("createdAt");

-- CreateIndex
CREATE INDEX "AgentSession_agentType_idx" ON "AgentSession"("agentType");

-- CreateIndex
CREATE INDEX "AgentSession_userId_idx" ON "AgentSession"("userId");

-- CreateIndex
CREATE INDEX "AgentSession_adminId_idx" ON "AgentSession"("adminId");

-- CreateIndex
CREATE INDEX "AgentSession_correlationId_idx" ON "AgentSession"("correlationId");

-- CreateIndex
CREATE INDEX "AgentSession_tenantId_idx" ON "AgentSession"("tenantId");

-- CreateIndex
CREATE INDEX "AgentMessage_sessionId_idx" ON "AgentMessage"("sessionId");

-- CreateIndex
CREATE INDEX "AgentMessage_role_idx" ON "AgentMessage"("role");

-- CreateIndex
CREATE INDEX "AgentMessage_kind_idx" ON "AgentMessage"("kind");

-- CreateIndex
CREATE INDEX "AgentMessage_createdAt_idx" ON "AgentMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AgentProposal_agentType_idx" ON "AgentProposal"("agentType");

-- CreateIndex
CREATE INDEX "AgentProposal_targetEntityType_targetEntityId_idx" ON "AgentProposal"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "AgentProposal_status_idx" ON "AgentProposal"("status");

-- CreateIndex
CREATE INDEX "AgentProposal_adeDecisionId_idx" ON "AgentProposal"("adeDecisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpSession" ADD CONSTRAINT "OtpSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecurity" ADD CONSTRAINT "UserSecurity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIntelligence" ADD CONSTRAINT "UserIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "LogisticsPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousDecision" ADD CONSTRAINT "AutonomousDecision_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "DecisionPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProposal" ADD CONSTRAINT "AgentProposal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProposal" ADD CONSTRAINT "AgentProposal_adeDecisionId_fkey" FOREIGN KEY ("adeDecisionId") REFERENCES "AutonomousDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
