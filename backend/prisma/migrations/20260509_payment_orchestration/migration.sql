-- =====================================================================
-- Payment Orchestration Layer - Schema Migration
-- Production-grade idempotent migration for Razorpay event processing
-- =====================================================================

-- 1. WebhookEvent: raw snapshot + idempotency store
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "eventId"       TEXT NOT NULL UNIQUE,
  "eventType"     TEXT NOT NULL,
  "rawPayload"    JSONB NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'RECEIVED',
  "processingLog" JSONB,
  "retryCount"    INTEGER NOT NULL DEFAULT 0,
  "lastError"     TEXT,
  "correlationId" TEXT,
  "idempotencyKey" TEXT UNIQUE,
  "processedAt"   TIMESTAMP(3),
  "deadLetteredAt" TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");
CREATE INDEX IF NOT EXISTS "WebhookEvent_status_idx"    ON "WebhookEvent"("status");
CREATE INDEX IF NOT EXISTS "WebhookEvent_correlationId_idx" ON "WebhookEvent"("correlationId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- 2. PaymentRecord: canonical payment entity across gateway/order
CREATE TABLE IF NOT EXISTS "PaymentRecord" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "razorpayPaymentId"  TEXT NOT NULL UNIQUE,
  "razorpayOrderId"    TEXT,
  "orderId"            TEXT,
  "userId"             TEXT,
  "amountPaise"        INTEGER NOT NULL,
  "currency"           TEXT NOT NULL DEFAULT 'INR',
  "status"             TEXT NOT NULL DEFAULT 'CREATED',
  "method"             TEXT,
  "bank"               TEXT,
  "wallet"             TEXT,
  "vpa"                TEXT,
  "email"              TEXT,
  "contact"            TEXT,
  "description"        TEXT,
  "international"      BOOLEAN NOT NULL DEFAULT false,
  "captured"           BOOLEAN NOT NULL DEFAULT false,
  "capturedAt"         TIMESTAMP(3),
  "authorizedAt"       TIMESTAMP(3),
  "errorCode"          TEXT,
  "errorDescription"   TEXT,
  "errorSource"        TEXT,
  "errorStep"          TEXT,
  "errorReason"        TEXT,
  "fraudScore"         FLOAT,
  "gatewayMetadata"    JSONB,
  "retryEligible"      BOOLEAN NOT NULL DEFAULT false,
  "recoveryState"      TEXT,
  "idempotencyKey"     TEXT UNIQUE,
  "correlationId"      TEXT,
  "tenantId"           TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PaymentRecord_razorpayOrderId_idx" ON "PaymentRecord"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_orderId_idx"         ON "PaymentRecord"("orderId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_status_idx"          ON "PaymentRecord"("status");
CREATE INDEX IF NOT EXISTS "PaymentRecord_userId_idx"          ON "PaymentRecord"("userId");
CREATE INDEX IF NOT EXISTS "PaymentRecord_createdAt_idx"       ON "PaymentRecord"("createdAt");

-- 3. PaymentAuditLog: immutable audit trail per payment lifecycle event
CREATE TABLE IF NOT EXISTS "PaymentAuditLog" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "paymentId"     TEXT,
  "orderId"       TEXT,
  "eventType"     TEXT NOT NULL,
  "fromStatus"    TEXT,
  "toStatus"      TEXT,
  "actor"         TEXT NOT NULL DEFAULT 'SYSTEM',
  "actorId"       TEXT,
  "metadata"      JSONB,
  "correlationId" TEXT,
  "webhookEventId" TEXT,
  "occurredAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PaymentAuditLog_paymentId_idx"  ON "PaymentAuditLog"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentAuditLog_orderId_idx"    ON "PaymentAuditLog"("orderId");
CREATE INDEX IF NOT EXISTS "PaymentAuditLog_eventType_idx"  ON "PaymentAuditLog"("eventType");
CREATE INDEX IF NOT EXISTS "PaymentAuditLog_occurredAt_idx" ON "PaymentAuditLog"("occurredAt");

-- 4. RefundRecord: full refund lifecycle
CREATE TABLE IF NOT EXISTS "RefundRecord" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "razorpayRefundId"  TEXT NOT NULL UNIQUE,
  "razorpayPaymentId" TEXT NOT NULL,
  "orderId"           TEXT,
  "amountPaise"       INTEGER NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'INR',
  "status"            TEXT NOT NULL DEFAULT 'INITIATED',
  "speedProcessed"    TEXT,
  "notes"             JSONB,
  "receipt"           TEXT,
  "batchId"           TEXT,
  "acquirerData"      JSONB,
  "processedAt"       TIMESTAMP(3),
  "failedAt"          TIMESTAMP(3),
  "failureReason"     TEXT,
  "retryCount"        INTEGER NOT NULL DEFAULT 0,
  "idempotencyKey"    TEXT UNIQUE,
  "correlationId"     TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RefundRecord_razorpayPaymentId_idx" ON "RefundRecord"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "RefundRecord_orderId_idx"           ON "RefundRecord"("orderId");
CREATE INDEX IF NOT EXISTS "RefundRecord_status_idx"            ON "RefundRecord"("status");
CREATE INDEX IF NOT EXISTS "RefundRecord_createdAt_idx"         ON "RefundRecord"("createdAt");

-- 5. DisputeRecord: payment dispute lifecycle
CREATE TABLE IF NOT EXISTS "DisputeRecord" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "razorpayDisputeId" TEXT NOT NULL UNIQUE,
  "razorpayPaymentId" TEXT NOT NULL,
  "orderId"           TEXT,
  "amountPaise"       INTEGER NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'INR',
  "status"            TEXT NOT NULL,
  "phase"             TEXT NOT NULL,
  "reason"            TEXT,
  "respondBy"         TIMESTAMP(3),
  "lostAt"            TIMESTAMP(3),
  "wonAt"             TIMESTAMP(3),
  "evidence"          JSONB,
  "correlationId"     TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DisputeRecord_razorpayPaymentId_idx" ON "DisputeRecord"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "DisputeRecord_status_idx"            ON "DisputeRecord"("status");
CREATE INDEX IF NOT EXISTS "DisputeRecord_phase_idx"             ON "DisputeRecord"("phase");

-- 6. SubscriptionRecord
CREATE TABLE IF NOT EXISTS "SubscriptionRecord" (
  "id"                     TEXT NOT NULL PRIMARY KEY,
  "razorpaySubscriptionId" TEXT NOT NULL UNIQUE,
  "planId"                 TEXT,
  "customerId"             TEXT,
  "userId"                 TEXT,
  "status"                 TEXT NOT NULL,
  "currentStart"           TIMESTAMP(3),
  "currentEnd"             TIMESTAMP(3),
  "endedAt"                TIMESTAMP(3),
  "quantity"               INTEGER NOT NULL DEFAULT 1,
  "totalCount"             INTEGER,
  "paidCount"              INTEGER NOT NULL DEFAULT 0,
  "remainingCount"         INTEGER,
  "chargeAt"               TIMESTAMP(3),
  "notes"                  JSONB,
  "correlationId"          TEXT,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SubscriptionRecord_status_idx"  ON "SubscriptionRecord"("status");
CREATE INDEX IF NOT EXISTS "SubscriptionRecord_userId_idx"  ON "SubscriptionRecord"("userId");

-- 7. SettlementRecord
CREATE TABLE IF NOT EXISTS "SettlementRecord" (
  "id"                    TEXT NOT NULL PRIMARY KEY,
  "razorpaySettlementId"  TEXT NOT NULL UNIQUE,
  "entityType"            TEXT NOT NULL DEFAULT 'settlement',
  "amountPaise"           INTEGER NOT NULL,
  "currency"              TEXT NOT NULL DEFAULT 'INR',
  "status"                TEXT NOT NULL,
  "fees"                  INTEGER NOT NULL DEFAULT 0,
  "tax"                   INTEGER NOT NULL DEFAULT 0,
  "utr"                   TEXT,
  "description"           TEXT,
  "settledAt"             TIMESTAMP(3),
  "reconciledAt"          TIMESTAMP(3),
  "isReconciled"          BOOLEAN NOT NULL DEFAULT false,
  "correlationId"         TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SettlementRecord_status_idx"       ON "SettlementRecord"("status");
CREATE INDEX IF NOT EXISTS "SettlementRecord_isReconciled_idx" ON "SettlementRecord"("isReconciled");
CREATE INDEX IF NOT EXISTS "SettlementRecord_settledAt_idx"    ON "SettlementRecord"("settledAt");

-- 8. PaymentLinkRecord
CREATE TABLE IF NOT EXISTS "PaymentLinkRecord" (
  "id"                   TEXT NOT NULL PRIMARY KEY,
  "razorpayLinkId"       TEXT NOT NULL UNIQUE,
  "amountPaise"          INTEGER NOT NULL,
  "currency"             TEXT NOT NULL DEFAULT 'INR',
  "status"               TEXT NOT NULL,
  "description"          TEXT,
  "expiresAt"            TIMESTAMP(3),
  "paidAt"               TIMESTAMP(3),
  "razorpayPaymentId"    TEXT,
  "shortUrl"             TEXT,
  "referenceId"          TEXT,
  "customerId"           TEXT,
  "userId"               TEXT,
  "notes"                JSONB,
  "correlationId"        TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PaymentLinkRecord_status_idx"  ON "PaymentLinkRecord"("status");
CREATE INDEX IF NOT EXISTS "PaymentLinkRecord_userId_idx"  ON "PaymentLinkRecord"("userId");

-- 9. DomainEventOutbox: internal domain events for downstream consumers
CREATE TABLE IF NOT EXISTS "DomainEventOutbox" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "eventType"     TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId"   TEXT NOT NULL,
  "payload"       JSONB NOT NULL,
  "correlationId" TEXT,
  "published"     BOOLEAN NOT NULL DEFAULT false,
  "publishedAt"   TIMESTAMP(3),
  "retryCount"    INTEGER NOT NULL DEFAULT 0,
  "lastError"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DomainEventOutbox_published_idx"     ON "DomainEventOutbox"("published");
CREATE INDEX IF NOT EXISTS "DomainEventOutbox_eventType_idx"     ON "DomainEventOutbox"("eventType");
CREATE INDEX IF NOT EXISTS "DomainEventOutbox_aggregateId_idx"   ON "DomainEventOutbox"("aggregateId");
CREATE INDEX IF NOT EXISTS "DomainEventOutbox_createdAt_idx"     ON "DomainEventOutbox"("createdAt");

-- 10. ReconciliationLedger: financial consistency
CREATE TABLE IF NOT EXISTS "ReconciliationLedger" (
  "id"                   TEXT NOT NULL PRIMARY KEY,
  "orderId"              TEXT,
  "razorpayPaymentId"    TEXT,
  "razorpayOrderId"      TEXT,
  "razorpayRefundId"     TEXT,
  "razorpaySettlementId" TEXT,
  "type"                 TEXT NOT NULL,
  "expectedAmountPaise"  INTEGER,
  "actualAmountPaise"    INTEGER,
  "discrepancy"          INTEGER,
  "status"               TEXT NOT NULL DEFAULT 'PENDING',
  "notes"                TEXT,
  "resolvedAt"           TIMESTAMP(3),
  "correlationId"        TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ReconciliationLedger_orderId_idx"  ON "ReconciliationLedger"("orderId");
CREATE INDEX IF NOT EXISTS "ReconciliationLedger_status_idx"   ON "ReconciliationLedger"("status");
CREATE INDEX IF NOT EXISTS "ReconciliationLedger_type_idx"     ON "ReconciliationLedger"("type");
