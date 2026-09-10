--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActorType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ActorType" AS ENUM (
    'USER',
    'ADMIN',
    'SYSTEM'
);


ALTER TYPE public."ActorType" OWNER TO postgres;

--
-- Name: AdminRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AdminRole" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN'
);


ALTER TYPE public."AdminRole" OWNER TO postgres;

--
-- Name: AgentMessageKind; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentMessageKind" AS ENUM (
    'QUESTION',
    'ANSWER',
    'REASONING',
    'PROPOSAL'
);


ALTER TYPE public."AgentMessageKind" OWNER TO postgres;

--
-- Name: AgentMessageRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentMessageRole" AS ENUM (
    'USER',
    'AGENT',
    'SYSTEM'
);


ALTER TYPE public."AgentMessageRole" OWNER TO postgres;

--
-- Name: AgentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentType" AS ENUM (
    'CUSTOMER_SUPPORT',
    'TRUST_SECURITY',
    'COMMERCE_ADVISORY',
    'ADMIN_COPILOT'
);


ALTER TYPE public."AgentType" OWNER TO postgres;

--
-- Name: LedgerType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LedgerType" AS ENUM (
    'DEBIT',
    'CREDIT'
);


ALTER TYPE public."LedgerType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'CREATED',
    'PAYMENT_PENDING',
    'PAYMENT_CONFIRMED',
    'PACKED',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'FAILED',
    'RETURN_REQUESTED',
    'RETURNED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: OtpStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OtpStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'EXPIRED',
    'LOCKED',
    'USED'
);


ALTER TYPE public."OtpStatus" OWNER TO postgres;

--
-- Name: OtpType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OtpType" AS ENUM (
    'REGISTER',
    'LOGIN',
    'RESET',
    'TWO_FACTOR',
    'CHANGE_PHONE',
    'CHANGE_EMAIL'
);


ALTER TYPE public."OtpType" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'RAZORPAY',
    'COD',
    'UPI',
    'CARD'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."ProductStatus" OWNER TO postgres;

--
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'RESERVED',
    'RELEASED',
    'FULFILLED'
);


ALTER TYPE public."ReservationStatus" OWNER TO postgres;

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ReviewStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'USER',
    'DELIVERY_AGENT'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Admin" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."AdminRole" DEFAULT 'ADMIN'::public."AdminRole" NOT NULL,
    avatar text,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Admin" OWNER TO postgres;

--
-- Name: AdminLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminLog" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    action text NOT NULL,
    details jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AdminLog" OWNER TO postgres;

--
-- Name: AgentMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AgentMessage" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    role public."AgentMessageRole" NOT NULL,
    kind public."AgentMessageKind" NOT NULL,
    content text NOT NULL,
    payload jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgentMessage" OWNER TO postgres;

--
-- Name: AgentProposal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AgentProposal" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "agentType" public."AgentType" NOT NULL,
    "targetEntityType" text NOT NULL,
    "targetEntityId" text,
    "suggestedAction" text NOT NULL,
    rationale jsonb,
    "confidenceScore" double precision,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "adeDecisionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgentProposal" OWNER TO postgres;

--
-- Name: AgentSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AgentSession" (
    id text NOT NULL,
    "tenantId" text,
    "userId" text,
    "adminId" text,
    "agentType" public."AgentType" NOT NULL,
    topic text,
    "correlationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgentSession" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorType" public."ActorType" NOT NULL,
    "actorId" text NOT NULL,
    action text NOT NULL,
    metadata jsonb,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: AutonomousDecision; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AutonomousDecision" (
    id text NOT NULL,
    "policyId" text NOT NULL,
    "policyVersion" integer NOT NULL,
    "triggerSignal" text NOT NULL,
    "triggerPayload" jsonb,
    "confidenceScore" double precision DEFAULT 1.0 NOT NULL,
    "impactLevel" text DEFAULT 'LOW'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "actionTaken" text NOT NULL,
    "actionResponse" jsonb,
    "errorMessage" text,
    "correlationId" text,
    "entityType" text,
    "entityId" text,
    "isOverridden" boolean DEFAULT false NOT NULL,
    "overriddenBy" text,
    "overrideReason" text,
    "executedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AutonomousDecision" OWNER TO postgres;

--
-- Name: BehavioralEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BehavioralEvent" (
    id text NOT NULL,
    "userId" text,
    "eventType" text NOT NULL,
    "entityId" text,
    "entityType" text,
    payload jsonb,
    metadata jsonb,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BehavioralEvent" OWNER TO postgres;

--
-- Name: BusinessConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BusinessConfig" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "businessName" text NOT NULL,
    "registeredAddress" jsonb NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    website text,
    gstin text NOT NULL,
    pan text,
    cin text,
    "stateCode" text NOT NULL,
    logo text,
    "logoVector" text,
    "brandColorPrimary" text DEFAULT '#D4AF37'::text NOT NULL,
    "brandColorSecondary" text DEFAULT '#1A1A1A'::text NOT NULL,
    "brandColorAccent" text DEFAULT '#FAFAFA'::text NOT NULL,
    "authorizedSignatory" text NOT NULL,
    "signatureImage" text,
    designation text,
    "companyStamp" text,
    jurisdiction text DEFAULT 'Gujarat'::text NOT NULL,
    "returnPolicyDays" integer DEFAULT 7 NOT NULL,
    "legalText" text,
    disclaimer text,
    "invoicePrefix" text DEFAULT 'TRIVENI-INV'::text NOT NULL,
    "invoiceStartNumber" integer DEFAULT 1 NOT NULL,
    "defaultTerms" text,
    "showPricesWithGST" boolean DEFAULT true NOT NULL,
    "bankName" text,
    "bankAccountNumber" text,
    "bankIFSC" text,
    "bankBranch" text,
    "upiId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BusinessConfig" OWNER TO postgres;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" text
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: ContactSubmission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ContactSubmission" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    subject text,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ContactSubmission" OWNER TO postgres;

--
-- Name: DecisionPolicy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DecisionPolicy" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    rules jsonb NOT NULL,
    thresholds jsonb,
    version integer DEFAULT 1 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DecisionPolicy" OWNER TO postgres;

--
-- Name: DeletedUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeletedUser" (
    id text NOT NULL,
    "originalUserId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    "passwordHash" text NOT NULL,
    role public."Role" NOT NULL,
    avatar text,
    address jsonb,
    "accountCreatedAt" timestamp(3) without time zone NOT NULL,
    "accountDeletedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletionReason" text,
    "orderCount" integer DEFAULT 0 NOT NULL,
    "totalSpent" double precision DEFAULT 0 NOT NULL,
    "tenantId" text
);


ALTER TABLE public."DeletedUser" OWNER TO postgres;

--
-- Name: DeliveryAgent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryAgent" (
    id text NOT NULL,
    "tenantId" text,
    name text NOT NULL,
    phone text NOT NULL,
    "vehicleType" text,
    "vehicleNumber" text,
    active boolean DEFAULT true NOT NULL,
    "currentLat" double precision,
    "currentLng" double precision,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryAgent" OWNER TO postgres;

--
-- Name: DomainEventLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DomainEventLog" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "eventType" text NOT NULL,
    version text NOT NULL,
    payload jsonb NOT NULL,
    metadata jsonb,
    "occurredAt" timestamp(3) without time zone NOT NULL,
    "correlationId" text,
    actor text,
    "tenantId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DomainEventLog" OWNER TO postgres;

--
-- Name: InventoryReservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryReservation" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "orderId" text NOT NULL,
    quantity integer NOT NULL,
    status public."ReservationStatus" DEFAULT 'RESERVED'::public."ReservationStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InventoryReservation" OWNER TO postgres;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "tenantId" text,
    "invoiceNumber" text NOT NULL,
    "invoiceVersion" text DEFAULT '1.0'::text NOT NULL,
    "orderId" text NOT NULL,
    "invoiceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "fiscalYear" text NOT NULL,
    subtotal double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "taxableAmount" double precision NOT NULL,
    cgst double precision DEFAULT 0 NOT NULL,
    sgst double precision DEFAULT 0 NOT NULL,
    igst double precision DEFAULT 0 NOT NULL,
    "gstRate" double precision NOT NULL,
    "shippingCharge" double precision DEFAULT 0 NOT NULL,
    "codCharge" double precision DEFAULT 0 NOT NULL,
    "roundingAdjustment" double precision DEFAULT 0 NOT NULL,
    "grandTotal" double precision NOT NULL,
    "gstType" text NOT NULL,
    "placeOfSupply" text NOT NULL,
    "sellerGSTIN" text NOT NULL,
    "sellerPAN" text,
    "sellerCIN" text,
    "itemsHSN" jsonb NOT NULL,
    "paymentMethod" text NOT NULL,
    "paymentStatus" text NOT NULL,
    "paymentDate" timestamp(3) without time zone,
    "paymentTransactionId" text,
    "paymentGateway" text,
    "courierName" text,
    "trackingNumber" text,
    "estimatedDelivery" timestamp(3) without time zone,
    "pdfUrl" text,
    "pdfGeneratedAt" timestamp(3) without time zone,
    "pdfHash" text,
    "pdfVersion" text DEFAULT '1.0'::text NOT NULL,
    "digitalSignature" text,
    "signedBy" text,
    "signedAt" timestamp(3) without time zone,
    "verificationQR" text,
    "paymentQR" text,
    "barcodeData" text,
    watermark text,
    "copyType" text DEFAULT 'ORIGINAL'::text NOT NULL,
    "legalDeclarations" jsonb,
    "termsAndConditions" text,
    "returnPolicy" text,
    "templateId" text DEFAULT 'luxury-v1'::text NOT NULL,
    "themeVariant" text DEFAULT 'LIGHT'::text NOT NULL,
    "generatedBy" text,
    "regenerationCount" integer DEFAULT 0 NOT NULL,
    notes text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- Name: LedgerEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LedgerEntry" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "orderId" text,
    type public."LedgerType" NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    source text NOT NULL,
    description text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LedgerEntry" OWNER TO postgres;

--
-- Name: LogisticsPartner; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LogisticsPartner" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    "contactPerson" text,
    "contactEmail" text,
    "contactPhone" text,
    capabilities jsonb NOT NULL,
    "supportedPincodes" jsonb,
    "apiKey" text,
    "apiSecret" text,
    "apiUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "reliabilityScore" double precision DEFAULT 0.0 NOT NULL,
    "avgDeliveryDays" double precision DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LogisticsPartner" OWNER TO postgres;

--
-- Name: LoyaltyTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LoyaltyTransaction" (
    id text NOT NULL,
    "loyaltyId" text NOT NULL,
    type text NOT NULL,
    points integer NOT NULL,
    description text NOT NULL,
    reference text,
    "balanceBefore" integer NOT NULL,
    "balanceAfter" integer NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    expired boolean DEFAULT false NOT NULL,
    metadata jsonb,
    source text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LoyaltyTransaction" OWNER TO postgres;

--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationTemplate" (
    id text NOT NULL,
    "tenantId" text,
    name text NOT NULL,
    subject text,
    content text NOT NULL,
    platform text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTemplate" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text NOT NULL,
    subtotal double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    tax double precision DEFAULT 0 NOT NULL,
    "shippingCharge" double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "shippingAddress" jsonb NOT NULL,
    "billingAddress" jsonb,
    "razorpayOrderId" text,
    "razorpayPaymentId" text,
    "razorpaySignature" text,
    "trackingNumber" text,
    "estimatedDelivery" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "customerNotes" text,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deliveryAgentId" text,
    "escalationReason" text,
    "idempotencyKey" text,
    "isEscalated" boolean DEFAULT false NOT NULL,
    "isFlagged" boolean DEFAULT false NOT NULL,
    "riskLevel" text DEFAULT 'LOW'::text NOT NULL,
    "riskReport" jsonb,
    "riskScore" double precision DEFAULT 0 NOT NULL,
    "slaDeadline" timestamp(3) without time zone,
    "tenantId" text
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: OrderAnalytic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderAnalytic" (
    id text NOT NULL,
    "tenantId" text,
    date timestamp(3) without time zone NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "completionRate" double precision DEFAULT 0 NOT NULL,
    "averageDuration" double precision DEFAULT 0 NOT NULL,
    "cancellationRate" double precision DEFAULT 0 NOT NULL,
    "topProductId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrderAnalytic" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    subtotal double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: OrderReadModel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderReadModel" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "orderNumber" text NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    status text NOT NULL,
    "paymentStatus" text NOT NULL,
    "itemCount" integer NOT NULL,
    "lastEventTitle" text,
    "isEscalated" boolean DEFAULT false NOT NULL,
    "isFlagged" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderReadModel" OWNER TO postgres;

--
-- Name: OrderTimelineEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderTimelineEvent" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    title text NOT NULL,
    description text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor text NOT NULL,
    metadata jsonb
);


ALTER TABLE public."OrderTimelineEvent" OWNER TO postgres;

--
-- Name: OtpSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OtpSession" (
    id text NOT NULL,
    "userId" text,
    email text,
    phone text,
    "otpHash" text NOT NULL,
    type public."OtpType" NOT NULL,
    status public."OtpStatus" DEFAULT 'PENDING'::public."OtpStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "resendCount" integer DEFAULT 0 NOT NULL,
    "lastResentAt" timestamp(3) without time zone,
    "ipAddress" text,
    "userAgent" text,
    "requestId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OtpSession" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price double precision NOT NULL,
    "discountPrice" double precision,
    images text[],
    thumbnail text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isTrending" boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    sku text,
    views integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    badges text[] DEFAULT ARRAY['Fine Precious Metals'::text, 'Handmade in India'::text, 'Everyday Luxury'::text, 'Insured Shipping'::text],
    "careInstructions" text DEFAULT 'After each use, gently wipe your jewelry with a soft cloth. Store in a cool, dry place away from direct sunlight. Avoid immersing your jewelry in water. Refrain from cleaning with soap or harsh chemicals.'::text,
    "categoryId" text NOT NULL,
    "gstIncluded" boolean DEFAULT true NOT NULL,
    inventory jsonb,
    "platingType" text,
    seo jsonb,
    "shortTagline" text,
    specifications jsonb,
    status public."ProductStatus" DEFAULT 'ACTIVE'::public."ProductStatus" NOT NULL,
    "tenantId" text,
    "basePrice" double precision DEFAULT 0,
    "sellingPrice" double precision DEFAULT 0
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: ProfileActivity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileActivity" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    type text NOT NULL,
    action text,
    category text,
    "entityType" text,
    "entityId" text,
    "entityName" text,
    metadata jsonb,
    value double precision,
    "sessionId" text,
    referrer text,
    page text,
    ip text,
    "userAgent" text,
    device text,
    os text,
    browser text,
    country text,
    region text,
    city text,
    timezone text,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProfileActivity" OWNER TO postgres;

--
-- Name: ProfileAddress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileAddress" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    line1 text NOT NULL,
    line2 text,
    landmark text,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    country text DEFAULT 'India'::text NOT NULL,
    type text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    label text,
    instructions text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProfileAddress" OWNER TO postgres;

--
-- Name: ProfileCommunication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileCommunication" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    type text NOT NULL,
    channel text NOT NULL,
    "templateId" text,
    subject text,
    message text NOT NULL,
    "htmlContent" text,
    status text NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "openedAt" timestamp(3) without time zone,
    "clickedAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "openCount" integer DEFAULT 0 NOT NULL,
    "clickCount" integer DEFAULT 0 NOT NULL,
    "linksClicked" jsonb,
    error text,
    "errorCode" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProfileCommunication" OWNER TO postgres;

--
-- Name: ProfileDevice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileDevice" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "deviceId" text NOT NULL,
    "deviceName" text,
    "deviceType" text NOT NULL,
    os text NOT NULL,
    "osVersion" text,
    browser text NOT NULL,
    "browserVersion" text,
    "screenResolution" text,
    language text,
    timezone text,
    country text,
    region text,
    city text,
    latitude double precision,
    longitude double precision,
    "firstSeen" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeen" timestamp(3) without time zone NOT NULL,
    "lastIp" text,
    "loginCount" integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isTrusted" boolean DEFAULT false NOT NULL,
    "riskScore" double precision DEFAULT 0 NOT NULL,
    metadata jsonb
);


ALTER TABLE public."ProfileDevice" OWNER TO postgres;

--
-- Name: ProfileLoyalty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileLoyalty" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    "lifetimePoints" integer DEFAULT 0 NOT NULL,
    "pointsRedeemed" integer DEFAULT 0 NOT NULL,
    "pointsExpiring" integer DEFAULT 0 NOT NULL,
    "nextExpiryDate" timestamp(3) without time zone,
    tier text DEFAULT 'BRONZE'::text NOT NULL,
    "tierSince" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "previousTier" text,
    "nextTier" text,
    "pointsToNextTier" integer DEFAULT 0 NOT NULL,
    "lifetimeSpend" double precision DEFAULT 0 NOT NULL,
    "lifetimeOrders" integer DEFAULT 0 NOT NULL,
    "averageOrderValue" double precision DEFAULT 0 NOT NULL,
    "highestOrderValue" double precision DEFAULT 0 NOT NULL,
    "redeemedCount" integer DEFAULT 0 NOT NULL,
    "redeemedValue" double precision DEFAULT 0 NOT NULL,
    "benefitsUsed" jsonb,
    "lastEarned" timestamp(3) without time zone,
    "lastRedeemed" timestamp(3) without time zone,
    "anniversaryDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "referralCode" text,
    "referralsCount" integer DEFAULT 0 NOT NULL,
    "referralEarnings" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProfileLoyalty" OWNER TO postgres;

--
-- Name: ProfileNote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileNote" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    title text,
    note text NOT NULL,
    category text,
    priority text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isPrivate" boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    "followUpAt" timestamp(3) without time zone,
    "followUpBy" text,
    resolved boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "createdBy" text NOT NULL,
    "updatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProfileNote" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text,
    rating integer NOT NULL,
    email text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text NOT NULL,
    "profileImageUrl" text,
    "reviewText" text NOT NULL,
    status public."ReviewStatus" DEFAULT 'PENDING'::public."ReviewStatus" NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: Shipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Shipment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "partnerId" text NOT NULL,
    "trackingNumber" text,
    "labelUrl" text,
    status text DEFAULT 'MANIFESTED'::text NOT NULL,
    weight double precision,
    dimensions jsonb,
    "manifestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "shippedAt" timestamp(3) without time zone,
    "expectedDeliveryAt" timestamp(3) without time zone,
    "actualDeliveryAt" timestamp(3) without time zone,
    waybill text,
    "manifestId" text
);


ALTER TABLE public."Shipment" OWNER TO postgres;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    settings jsonb,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    avatar text,
    "lastLoginAt" timestamp(3) without time zone,
    "loginCount" integer DEFAULT 0 NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "blockedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "isPhoneVerified" boolean DEFAULT false NOT NULL,
    "tenantId" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserAddress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserAddress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text DEFAULT 'Home'::text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "addressLine1" text NOT NULL,
    "addressLine2" text,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    country text DEFAULT 'India'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserAddress" OWNER TO postgres;

--
-- Name: UserIntelligence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserIntelligence" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text,
    ltv double precision DEFAULT 0 NOT NULL,
    aov double precision DEFAULT 0 NOT NULL,
    "orderCount" integer DEFAULT 0 NOT NULL,
    "totalSpent" double precision DEFAULT 0 NOT NULL,
    "lastOrderAt" timestamp(3) without time zone,
    "lastActiveAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionCount" integer DEFAULT 1 NOT NULL,
    "productViewsCount" integer DEFAULT 0 NOT NULL,
    "cartAdditions" integer DEFAULT 0 NOT NULL,
    "checkoutAttempts" integer DEFAULT 0 NOT NULL,
    "abandonedCarts" integer DEFAULT 0 NOT NULL,
    "conversionScore" double precision DEFAULT 0 NOT NULL,
    "churnScore" double precision DEFAULT 0 NOT NULL,
    "riskScore" double precision DEFAULT 0 NOT NULL,
    "trustIndex" double precision DEFAULT 0.5 NOT NULL,
    "lifecycleStage" text DEFAULT 'NEW'::text NOT NULL,
    "categoryAffinity" jsonb,
    "behavioralSignals" jsonb,
    "confidenceBands" jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserIntelligence" OWNER TO postgres;

--
-- Name: UserProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fullName" text NOT NULL,
    "displayName" text,
    gender text,
    dob timestamp(3) without time zone,
    "profileImage" text,
    email text NOT NULL,
    phone text NOT NULL,
    "alternateEmail" text,
    "alternatePhone" text,
    "accountStatus" text DEFAULT 'ACTIVE'::text NOT NULL,
    "verificationLevel" text DEFAULT 'BASIC'::text NOT NULL,
    "loyaltyTier" text DEFAULT 'BRONZE'::text NOT NULL,
    "lifetimeValue" double precision DEFAULT 0 NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "totalSpent" double precision DEFAULT 0 NOT NULL,
    "lastActiveAt" timestamp(3) without time zone,
    "lastPurchaseAt" timestamp(3) without time zone,
    "engagementScore" double precision DEFAULT 0 NOT NULL,
    "churnRisk" double precision DEFAULT 0 NOT NULL,
    "fraudRisk" double precision DEFAULT 0 NOT NULL,
    preferences jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserProfile" OWNER TO postgres;

--
-- Name: UserSecurity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSecurity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "preferred2FAMethod" text DEFAULT 'EMAIL'::text,
    "backupCodes" jsonb,
    "lastPasswordChangedAt" timestamp(3) without time zone,
    "securityScore" double precision DEFAULT 0 NOT NULL,
    "lastSecurityCheckAt" timestamp(3) without time zone,
    "trustedDevices" jsonb
);


ALTER TABLE public."UserSecurity" OWNER TO postgres;

--
-- Name: WebhookSubscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WebhookSubscription" (
    id text NOT NULL,
    "tenantId" text,
    url text NOT NULL,
    event text NOT NULL,
    secret text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WebhookSubscription" OWNER TO postgres;

--
-- Name: WishlistItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WishlistItem" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WishlistItem" OWNER TO postgres;

--
-- Name: WorkflowRule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkflowRule" (
    id text NOT NULL,
    "tenantId" text,
    name text NOT NULL,
    "triggerEvent" text NOT NULL,
    conditions jsonb,
    actions jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkflowRule" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Admin" (id, name, email, "passwordHash", role, avatar, phone, "isActive", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
b68cb4e1-f00c-4789-86d8-1d7072ea6347	Super Admin	mahakal.mahakali014@gmail.com	$2a$12$W6IZl0th3bzIkIi2IL1uFep.A7SVUsIZVXJUzFni8qYq7pxtkmzz.	SUPER_ADMIN	\N	\N	t	2026-02-13 08:47:45.789	2026-02-06 12:24:23.084	2026-02-13 08:47:45.79
\.


--
-- Data for Name: AdminLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminLog" (id, "adminId", action, details, "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: AgentMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AgentMessage" (id, "sessionId", role, kind, content, payload, "createdAt") FROM stdin;
\.


--
-- Data for Name: AgentProposal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AgentProposal" (id, "sessionId", "agentType", "targetEntityType", "targetEntityId", "suggestedAction", rationale, "confidenceScore", status, "adeDecisionId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AgentSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AgentSession" (id, "tenantId", "userId", "adminId", "agentType", topic, "correlationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "actorType", "actorId", action, metadata, ip, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: AutonomousDecision; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AutonomousDecision" (id, "policyId", "policyVersion", "triggerSignal", "triggerPayload", "confidenceScore", "impactLevel", status, "actionTaken", "actionResponse", "errorMessage", "correlationId", "entityType", "entityId", "isOverridden", "overriddenBy", "overrideReason", "executedAt", "updatedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: BehavioralEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BehavioralEvent" (id, "userId", "eventType", "entityId", "entityType", payload, metadata, "occurredAt") FROM stdin;
\.


--
-- Data for Name: BusinessConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BusinessConfig" (id, "tenantId", "businessName", "registeredAddress", phone, email, website, gstin, pan, cin, "stateCode", logo, "logoVector", "brandColorPrimary", "brandColorSecondary", "brandColorAccent", "authorizedSignatory", "signatureImage", designation, "companyStamp", jurisdiction, "returnPolicyDays", "legalText", disclaimer, "invoicePrefix", "invoiceStartNumber", "defaultTerms", "showPricesWithGST", "bankName", "bankAccountNumber", "bankIFSC", "bankBranch", "upiId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "userId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, slug, description, image, icon, "isActive", "sortOrder", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: ContactSubmission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ContactSubmission" (id, name, email, phone, subject, message, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: DecisionPolicy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DecisionPolicy" (id, name, description, category, priority, "isActive", rules, thresholds, version, "updatedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: DeletedUser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeletedUser" (id, "originalUserId", name, email, phone, "passwordHash", role, avatar, address, "accountCreatedAt", "accountDeletedAt", "deletionReason", "orderCount", "totalSpent", "tenantId") FROM stdin;
\.


--
-- Data for Name: DeliveryAgent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryAgent" (id, "tenantId", name, phone, "vehicleType", "vehicleNumber", active, "currentLat", "currentLng", "lastUpdated", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DomainEventLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DomainEventLog" (id, "eventId", "eventType", version, payload, metadata, "occurredAt", "correlationId", actor, "tenantId", "createdAt") FROM stdin;
\.


--
-- Data for Name: InventoryReservation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryReservation" (id, "productId", "orderId", quantity, status, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, "tenantId", "invoiceNumber", "invoiceVersion", "orderId", "invoiceDate", "dueDate", "fiscalYear", subtotal, discount, "taxableAmount", cgst, sgst, igst, "gstRate", "shippingCharge", "codCharge", "roundingAdjustment", "grandTotal", "gstType", "placeOfSupply", "sellerGSTIN", "sellerPAN", "sellerCIN", "itemsHSN", "paymentMethod", "paymentStatus", "paymentDate", "paymentTransactionId", "paymentGateway", "courierName", "trackingNumber", "estimatedDelivery", "pdfUrl", "pdfGeneratedAt", "pdfHash", "pdfVersion", "digitalSignature", "signedBy", "signedAt", "verificationQR", "paymentQR", "barcodeData", watermark, "copyType", "legalDeclarations", "termsAndConditions", "returnPolicy", "templateId", "themeVariant", "generatedBy", "regenerationCount", notes, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LedgerEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LedgerEntry" (id, "tenantId", "orderId", type, amount, currency, source, description, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: LogisticsPartner; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LogisticsPartner" (id, name, code, type, "contactPerson", "contactEmail", "contactPhone", capabilities, "supportedPincodes", "apiKey", "apiSecret", "apiUrl", "isActive", "reliabilityScore", "avgDeliveryDays", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LoyaltyTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LoyaltyTransaction" (id, "loyaltyId", type, points, description, reference, "balanceBefore", "balanceAfter", "expiresAt", expired, metadata, source, "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationTemplate" (id, "tenantId", name, subject, content, platform, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", subtotal, discount, tax, "shippingCharge", total, status, "paymentStatus", "paymentMethod", "shippingAddress", "billingAddress", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature", "trackingNumber", "estimatedDelivery", "deliveredAt", "customerNotes", "adminNotes", "createdAt", "updatedAt", "deliveryAgentId", "escalationReason", "idempotencyKey", "isEscalated", "isFlagged", "riskLevel", "riskReport", "riskScore", "slaDeadline", "tenantId") FROM stdin;
\.


--
-- Data for Name: OrderAnalytic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderAnalytic" (id, "tenantId", date, "totalOrders", "totalRevenue", "completionRate", "averageDuration", "cancellationRate", "topProductId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, discount, subtotal, "createdAt") FROM stdin;
\.


--
-- Data for Name: OrderReadModel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderReadModel" (id, "tenantId", "orderNumber", "customerName", "customerEmail", "totalAmount", status, "paymentStatus", "itemCount", "lastEventTitle", "isEscalated", "isFlagged", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderTimelineEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderTimelineEvent" (id, "orderId", status, title, description, "timestamp", actor, metadata) FROM stdin;
\.


--
-- Data for Name: OtpSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OtpSession" (id, "userId", email, phone, "otpHash", type, status, "expiresAt", attempts, "resendCount", "lastResentAt", "ipAddress", "userAgent", "requestId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, price, "discountPrice", images, thumbnail, "isActive", "isFeatured", "isTrending", tags, sku, views, "createdAt", "updatedAt", badges, "careInstructions", "categoryId", "gstIncluded", inventory, "platingType", seo, "shortTagline", specifications, status, "tenantId", "basePrice", "sellingPrice") FROM stdin;
\.


--
-- Data for Name: ProfileActivity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileActivity" (id, "profileId", type, action, category, "entityType", "entityId", "entityName", metadata, value, "sessionId", referrer, page, ip, "userAgent", device, os, browser, country, region, city, timezone, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: ProfileAddress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileAddress" (id, "profileId", name, phone, line1, line2, landmark, city, state, pincode, country, type, "isDefault", label, instructions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProfileCommunication; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileCommunication" (id, "profileId", type, channel, "templateId", subject, message, "htmlContent", status, "sentAt", "deliveredAt", "openedAt", "clickedAt", "failedAt", "openCount", "clickCount", "linksClicked", error, "errorCode", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: ProfileDevice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileDevice" (id, "profileId", "deviceId", "deviceName", "deviceType", os, "osVersion", browser, "browserVersion", "screenResolution", language, timezone, country, region, city, latitude, longitude, "firstSeen", "lastSeen", "lastIp", "loginCount", "isActive", "isTrusted", "riskScore", metadata) FROM stdin;
\.


--
-- Data for Name: ProfileLoyalty; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileLoyalty" (id, "profileId", points, "lifetimePoints", "pointsRedeemed", "pointsExpiring", "nextExpiryDate", tier, "tierSince", "previousTier", "nextTier", "pointsToNextTier", "lifetimeSpend", "lifetimeOrders", "averageOrderValue", "highestOrderValue", "redeemedCount", "redeemedValue", "benefitsUsed", "lastEarned", "lastRedeemed", "anniversaryDate", "referralCode", "referralsCount", "referralEarnings", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProfileNote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileNote" (id, "profileId", title, note, category, priority, "isActive", "isPrivate", tags, "followUpAt", "followUpBy", resolved, "resolvedAt", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, "productId", "userId", rating, email, "isVerified", "createdAt", "updatedAt", name, "profileImageUrl", "reviewText", status) FROM stdin;
\.


--
-- Data for Name: Shipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Shipment" (id, "orderId", "partnerId", "trackingNumber", "labelUrl", status, weight, dimensions, "manifestedAt", "shippedAt", "expectedDeliveryAt", "actualDeliveryAt", waybill, "manifestId") FROM stdin;
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tenant" (id, name, slug, domain, settings, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, phone, "passwordHash", role, avatar, "lastLoginAt", "loginCount", "isBlocked", "blockedReason", "createdAt", "updatedAt", "isEmailVerified", "isPhoneVerified", "tenantId") FROM stdin;
\.


--
-- Data for Name: UserAddress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserAddress" (id, "userId", label, name, phone, "addressLine1", "addressLine2", city, state, pincode, country, "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserIntelligence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserIntelligence" (id, "userId", "tenantId", ltv, aov, "orderCount", "totalSpent", "lastOrderAt", "lastActiveAt", "sessionCount", "productViewsCount", "cartAdditions", "checkoutAttempts", "abandonedCarts", "conversionScore", "churnScore", "riskScore", "trustIndex", "lifecycleStage", "categoryAffinity", "behavioralSignals", "confidenceBands", "updatedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: UserProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserProfile" (id, "userId", "fullName", "displayName", gender, dob, "profileImage", email, phone, "alternateEmail", "alternatePhone", "accountStatus", "verificationLevel", "loyaltyTier", "lifetimeValue", "totalOrders", "totalSpent", "lastActiveAt", "lastPurchaseAt", "engagementScore", "churnRisk", "fraudRisk", preferences, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserSecurity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSecurity" (id, "userId", "twoFactorEnabled", "preferred2FAMethod", "backupCodes", "lastPasswordChangedAt", "securityScore", "lastSecurityCheckAt", "trustedDevices") FROM stdin;
\.


--
-- Data for Name: WebhookSubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WebhookSubscription" (id, "tenantId", url, event, secret, "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: WishlistItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WishlistItem" (id, "userId", "productId", "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkflowRule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkflowRule" (id, "tenantId", name, "triggerEvent", conditions, actions, "isActive", priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f469e571-6473-46e3-8646-ffa0052caa05	ae3fc2c33e55ac53ae157a6e8276d9d90f323fd53e1571d6c8a3105c8e56f8f7	2026-02-06 17:50:48.285034+05:30	20260204125014_init	\N	\N	2026-02-06 17:50:47.568458+05:30	1
aa8711f2-283d-4af7-8988-ae0f28d4c076	73d4e22c72e0693adc68b1118cf1e2255138d2478a301ae9bae2be9cba40b64f	2026-02-06 17:50:48.325659+05:30	20260204151816_update_product_category_schema	\N	\N	2026-02-06 17:50:48.287981+05:30	1
d6015c05-102f-4db8-8cc2-c9f39b2c6673	77a89be2770a590e8f08807a7b200b6ca451e7179b2d03f4a058f6529e1d25c8	2026-02-06 17:52:32.907478+05:30	20260206122230_add_tenant_to_category	\N	\N	2026-02-06 17:52:30.75097+05:30	1
f582e2ad-af61-4a07-ab90-356ffa37314d	ac0a5827df1e879c476d1b251e6cd7533885754dbdef72c83e4b726a72748b7f	2026-02-06 19:48:36.222931+05:30	20260206141836_add_mrp_sp_to_product	\N	\N	2026-02-06 19:48:36.208138+05:30	1
\.


--
-- Name: AdminLog AdminLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminLog"
    ADD CONSTRAINT "AdminLog_pkey" PRIMARY KEY (id);


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: AgentMessage AgentMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentMessage"
    ADD CONSTRAINT "AgentMessage_pkey" PRIMARY KEY (id);


--
-- Name: AgentProposal AgentProposal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentProposal"
    ADD CONSTRAINT "AgentProposal_pkey" PRIMARY KEY (id);


--
-- Name: AgentSession AgentSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentSession"
    ADD CONSTRAINT "AgentSession_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AutonomousDecision AutonomousDecision_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AutonomousDecision"
    ADD CONSTRAINT "AutonomousDecision_pkey" PRIMARY KEY (id);


--
-- Name: BehavioralEvent BehavioralEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BehavioralEvent"
    ADD CONSTRAINT "BehavioralEvent_pkey" PRIMARY KEY (id);


--
-- Name: BusinessConfig BusinessConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessConfig"
    ADD CONSTRAINT "BusinessConfig_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: ContactSubmission ContactSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContactSubmission"
    ADD CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY (id);


--
-- Name: DecisionPolicy DecisionPolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DecisionPolicy"
    ADD CONSTRAINT "DecisionPolicy_pkey" PRIMARY KEY (id);


--
-- Name: DeletedUser DeletedUser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeletedUser"
    ADD CONSTRAINT "DeletedUser_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryAgent DeliveryAgent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryAgent"
    ADD CONSTRAINT "DeliveryAgent_pkey" PRIMARY KEY (id);


--
-- Name: DomainEventLog DomainEventLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DomainEventLog"
    ADD CONSTRAINT "DomainEventLog_pkey" PRIMARY KEY (id);


--
-- Name: InventoryReservation InventoryReservation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryReservation"
    ADD CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: LedgerEntry LedgerEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY (id);


--
-- Name: LogisticsPartner LogisticsPartner_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LogisticsPartner"
    ADD CONSTRAINT "LogisticsPartner_pkey" PRIMARY KEY (id);


--
-- Name: LoyaltyTransaction LoyaltyTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: OrderAnalytic OrderAnalytic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderAnalytic"
    ADD CONSTRAINT "OrderAnalytic_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: OrderReadModel OrderReadModel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderReadModel"
    ADD CONSTRAINT "OrderReadModel_pkey" PRIMARY KEY (id);


--
-- Name: OrderTimelineEvent OrderTimelineEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderTimelineEvent"
    ADD CONSTRAINT "OrderTimelineEvent_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: OtpSession OtpSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OtpSession"
    ADD CONSTRAINT "OtpSession_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ProfileActivity ProfileActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileActivity"
    ADD CONSTRAINT "ProfileActivity_pkey" PRIMARY KEY (id);


--
-- Name: ProfileAddress ProfileAddress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileAddress"
    ADD CONSTRAINT "ProfileAddress_pkey" PRIMARY KEY (id);


--
-- Name: ProfileCommunication ProfileCommunication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileCommunication"
    ADD CONSTRAINT "ProfileCommunication_pkey" PRIMARY KEY (id);


--
-- Name: ProfileDevice ProfileDevice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileDevice"
    ADD CONSTRAINT "ProfileDevice_pkey" PRIMARY KEY (id);


--
-- Name: ProfileLoyalty ProfileLoyalty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileLoyalty"
    ADD CONSTRAINT "ProfileLoyalty_pkey" PRIMARY KEY (id);


--
-- Name: ProfileNote ProfileNote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileNote"
    ADD CONSTRAINT "ProfileNote_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Shipment Shipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shipment"
    ADD CONSTRAINT "Shipment_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: UserAddress UserAddress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserAddress"
    ADD CONSTRAINT "UserAddress_pkey" PRIMARY KEY (id);


--
-- Name: UserIntelligence UserIntelligence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserIntelligence"
    ADD CONSTRAINT "UserIntelligence_pkey" PRIMARY KEY (id);


--
-- Name: UserProfile UserProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY (id);


--
-- Name: UserSecurity UserSecurity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSecurity"
    ADD CONSTRAINT "UserSecurity_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WebhookSubscription WebhookSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WebhookSubscription"
    ADD CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY (id);


--
-- Name: WishlistItem WishlistItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WishlistItem"
    ADD CONSTRAINT "WishlistItem_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowRule WorkflowRule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowRule"
    ADD CONSTRAINT "WorkflowRule_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AdminLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminLog_action_idx" ON public."AdminLog" USING btree (action);


--
-- Name: AdminLog_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminLog_adminId_idx" ON public."AdminLog" USING btree ("adminId");


--
-- Name: AdminLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminLog_createdAt_idx" ON public."AdminLog" USING btree ("createdAt");


--
-- Name: Admin_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Admin_email_idx" ON public."Admin" USING btree (email);


--
-- Name: Admin_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Admin_email_key" ON public."Admin" USING btree (email);


--
-- Name: Admin_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Admin_isActive_idx" ON public."Admin" USING btree ("isActive");


--
-- Name: Admin_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Admin_role_idx" ON public."Admin" USING btree (role);


--
-- Name: AgentMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentMessage_createdAt_idx" ON public."AgentMessage" USING btree ("createdAt");


--
-- Name: AgentMessage_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentMessage_kind_idx" ON public."AgentMessage" USING btree (kind);


--
-- Name: AgentMessage_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentMessage_role_idx" ON public."AgentMessage" USING btree (role);


--
-- Name: AgentMessage_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentMessage_sessionId_idx" ON public."AgentMessage" USING btree ("sessionId");


--
-- Name: AgentProposal_adeDecisionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentProposal_adeDecisionId_idx" ON public."AgentProposal" USING btree ("adeDecisionId");


--
-- Name: AgentProposal_agentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentProposal_agentType_idx" ON public."AgentProposal" USING btree ("agentType");


--
-- Name: AgentProposal_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentProposal_status_idx" ON public."AgentProposal" USING btree (status);


--
-- Name: AgentProposal_targetEntityType_targetEntityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentProposal_targetEntityType_targetEntityId_idx" ON public."AgentProposal" USING btree ("targetEntityType", "targetEntityId");


--
-- Name: AgentSession_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentSession_adminId_idx" ON public."AgentSession" USING btree ("adminId");


--
-- Name: AgentSession_agentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentSession_agentType_idx" ON public."AgentSession" USING btree ("agentType");


--
-- Name: AgentSession_correlationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentSession_correlationId_idx" ON public."AgentSession" USING btree ("correlationId");


--
-- Name: AgentSession_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentSession_tenantId_idx" ON public."AgentSession" USING btree ("tenantId");


--
-- Name: AgentSession_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentSession_userId_idx" ON public."AgentSession" USING btree ("userId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_actorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_actorId_idx" ON public."AuditLog" USING btree ("actorId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AutonomousDecision_correlationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutonomousDecision_correlationId_idx" ON public."AutonomousDecision" USING btree ("correlationId");


--
-- Name: AutonomousDecision_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutonomousDecision_createdAt_idx" ON public."AutonomousDecision" USING btree ("createdAt");


--
-- Name: AutonomousDecision_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutonomousDecision_entityId_idx" ON public."AutonomousDecision" USING btree ("entityId");


--
-- Name: AutonomousDecision_policyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutonomousDecision_policyId_idx" ON public."AutonomousDecision" USING btree ("policyId");


--
-- Name: AutonomousDecision_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AutonomousDecision_status_idx" ON public."AutonomousDecision" USING btree (status);


--
-- Name: BehavioralEvent_occurredAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BehavioralEvent_occurredAt_idx" ON public."BehavioralEvent" USING btree ("occurredAt");


--
-- Name: BehavioralEvent_userId_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BehavioralEvent_userId_eventType_idx" ON public."BehavioralEvent" USING btree ("userId", "eventType");


--
-- Name: BusinessConfig_gstin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BusinessConfig_gstin_idx" ON public."BusinessConfig" USING btree (gstin);


--
-- Name: BusinessConfig_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BusinessConfig_tenantId_idx" ON public."BusinessConfig" USING btree ("tenantId");


--
-- Name: BusinessConfig_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BusinessConfig_tenantId_key" ON public."BusinessConfig" USING btree ("tenantId");


--
-- Name: CartItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CartItem_productId_idx" ON public."CartItem" USING btree ("productId");


--
-- Name: CartItem_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CartItem_userId_idx" ON public."CartItem" USING btree ("userId");


--
-- Name: CartItem_userId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON public."CartItem" USING btree ("userId", "productId");


--
-- Name: Category_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Category_isActive_idx" ON public."Category" USING btree ("isActive");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Category_slug_idx" ON public."Category" USING btree (slug);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Category_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Category_tenantId_idx" ON public."Category" USING btree ("tenantId");


--
-- Name: ContactSubmission_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ContactSubmission_createdAt_idx" ON public."ContactSubmission" USING btree ("createdAt");


--
-- Name: ContactSubmission_isRead_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ContactSubmission_isRead_idx" ON public."ContactSubmission" USING btree ("isRead");


--
-- Name: DecisionPolicy_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DecisionPolicy_category_idx" ON public."DecisionPolicy" USING btree (category);


--
-- Name: DecisionPolicy_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DecisionPolicy_isActive_idx" ON public."DecisionPolicy" USING btree ("isActive");


--
-- Name: DecisionPolicy_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DecisionPolicy_name_key" ON public."DecisionPolicy" USING btree (name);


--
-- Name: DeletedUser_accountDeletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeletedUser_accountDeletedAt_idx" ON public."DeletedUser" USING btree ("accountDeletedAt");


--
-- Name: DeletedUser_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeletedUser_email_idx" ON public."DeletedUser" USING btree (email);


--
-- Name: DeletedUser_originalUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeletedUser_originalUserId_idx" ON public."DeletedUser" USING btree ("originalUserId");


--
-- Name: DeletedUser_originalUserId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeletedUser_originalUserId_key" ON public."DeletedUser" USING btree ("originalUserId");


--
-- Name: DeletedUser_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeletedUser_tenantId_idx" ON public."DeletedUser" USING btree ("tenantId");


--
-- Name: DeliveryAgent_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAgent_active_idx" ON public."DeliveryAgent" USING btree (active);


--
-- Name: DeliveryAgent_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAgent_phone_idx" ON public."DeliveryAgent" USING btree (phone);


--
-- Name: DeliveryAgent_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeliveryAgent_phone_key" ON public."DeliveryAgent" USING btree (phone);


--
-- Name: DeliveryAgent_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAgent_tenantId_idx" ON public."DeliveryAgent" USING btree ("tenantId");


--
-- Name: DomainEventLog_correlationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DomainEventLog_correlationId_idx" ON public."DomainEventLog" USING btree ("correlationId");


--
-- Name: DomainEventLog_eventId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DomainEventLog_eventId_key" ON public."DomainEventLog" USING btree ("eventId");


--
-- Name: DomainEventLog_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DomainEventLog_eventType_idx" ON public."DomainEventLog" USING btree ("eventType");


--
-- Name: DomainEventLog_occurredAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DomainEventLog_occurredAt_idx" ON public."DomainEventLog" USING btree ("occurredAt");


--
-- Name: InventoryReservation_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryReservation_orderId_idx" ON public."InventoryReservation" USING btree ("orderId");


--
-- Name: InventoryReservation_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryReservation_productId_idx" ON public."InventoryReservation" USING btree ("productId");


--
-- Name: InventoryReservation_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryReservation_status_idx" ON public."InventoryReservation" USING btree (status);


--
-- Name: Invoice_fiscalYear_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_fiscalYear_idx" ON public."Invoice" USING btree ("fiscalYear");


--
-- Name: Invoice_invoiceDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_invoiceDate_idx" ON public."Invoice" USING btree ("invoiceDate");


--
-- Name: Invoice_invoiceNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_invoiceNumber_idx" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_orderId_idx" ON public."Invoice" USING btree ("orderId");


--
-- Name: Invoice_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_orderId_key" ON public."Invoice" USING btree ("orderId");


--
-- Name: Invoice_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_paymentStatus_idx" ON public."Invoice" USING btree ("paymentStatus");


--
-- Name: Invoice_pdfHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_pdfHash_idx" ON public."Invoice" USING btree ("pdfHash");


--
-- Name: Invoice_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_tenantId_idx" ON public."Invoice" USING btree ("tenantId");


--
-- Name: LedgerEntry_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LedgerEntry_createdAt_idx" ON public."LedgerEntry" USING btree ("createdAt");


--
-- Name: LedgerEntry_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LedgerEntry_orderId_idx" ON public."LedgerEntry" USING btree ("orderId");


--
-- Name: LedgerEntry_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LedgerEntry_tenantId_idx" ON public."LedgerEntry" USING btree ("tenantId");


--
-- Name: LedgerEntry_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LedgerEntry_type_idx" ON public."LedgerEntry" USING btree (type);


--
-- Name: LogisticsPartner_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LogisticsPartner_code_key" ON public."LogisticsPartner" USING btree (code);


--
-- Name: LogisticsPartner_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LogisticsPartner_name_key" ON public."LogisticsPartner" USING btree (name);


--
-- Name: LoyaltyTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON public."LoyaltyTransaction" USING btree ("createdAt");


--
-- Name: LoyaltyTransaction_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoyaltyTransaction_expiresAt_idx" ON public."LoyaltyTransaction" USING btree ("expiresAt");


--
-- Name: LoyaltyTransaction_loyaltyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoyaltyTransaction_loyaltyId_idx" ON public."LoyaltyTransaction" USING btree ("loyaltyId");


--
-- Name: LoyaltyTransaction_source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoyaltyTransaction_source_idx" ON public."LoyaltyTransaction" USING btree (source);


--
-- Name: LoyaltyTransaction_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoyaltyTransaction_type_idx" ON public."LoyaltyTransaction" USING btree (type);


--
-- Name: NotificationTemplate_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON public."NotificationTemplate" USING btree (name);


--
-- Name: NotificationTemplate_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationTemplate_tenantId_idx" ON public."NotificationTemplate" USING btree ("tenantId");


--
-- Name: OrderAnalytic_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderAnalytic_date_idx" ON public."OrderAnalytic" USING btree (date);


--
-- Name: OrderAnalytic_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrderAnalytic_date_key" ON public."OrderAnalytic" USING btree (date);


--
-- Name: OrderAnalytic_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderAnalytic_tenantId_idx" ON public."OrderAnalytic" USING btree ("tenantId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: OrderReadModel_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderReadModel_createdAt_idx" ON public."OrderReadModel" USING btree ("createdAt");


--
-- Name: OrderReadModel_customerEmail_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderReadModel_customerEmail_idx" ON public."OrderReadModel" USING btree ("customerEmail");


--
-- Name: OrderReadModel_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrderReadModel_orderNumber_key" ON public."OrderReadModel" USING btree ("orderNumber");


--
-- Name: OrderReadModel_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderReadModel_status_idx" ON public."OrderReadModel" USING btree (status);


--
-- Name: OrderReadModel_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderReadModel_tenantId_idx" ON public."OrderReadModel" USING btree ("tenantId");


--
-- Name: OrderTimelineEvent_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderTimelineEvent_orderId_idx" ON public."OrderTimelineEvent" USING btree ("orderId");


--
-- Name: OrderTimelineEvent_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderTimelineEvent_status_idx" ON public."OrderTimelineEvent" USING btree (status);


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_deliveryAgentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_deliveryAgentId_idx" ON public."Order" USING btree ("deliveryAgentId");


--
-- Name: Order_idempotencyKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON public."Order" USING btree ("idempotencyKey");


--
-- Name: Order_isEscalated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_isEscalated_idx" ON public."Order" USING btree ("isEscalated");


--
-- Name: Order_isFlagged_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_isFlagged_idx" ON public."Order" USING btree ("isFlagged");


--
-- Name: Order_orderNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_orderNumber_idx" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_paymentStatus_idx" ON public."Order" USING btree ("paymentStatus");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_tenantId_idx" ON public."Order" USING btree ("tenantId");


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: OtpSession_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OtpSession_email_idx" ON public."OtpSession" USING btree (email);


--
-- Name: OtpSession_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OtpSession_phone_idx" ON public."OtpSession" USING btree (phone);


--
-- Name: OtpSession_requestId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OtpSession_requestId_key" ON public."OtpSession" USING btree ("requestId");


--
-- Name: OtpSession_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OtpSession_status_idx" ON public."OtpSession" USING btree (status);


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_isActive_idx" ON public."Product" USING btree ("isActive");


--
-- Name: Product_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_name_idx" ON public."Product" USING btree (name);


--
-- Name: Product_sku_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_sku_idx" ON public."Product" USING btree (sku);


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- Name: Product_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_slug_idx" ON public."Product" USING btree (slug);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Product_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_status_idx" ON public."Product" USING btree (status);


--
-- Name: Product_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_tenantId_idx" ON public."Product" USING btree ("tenantId");


--
-- Name: ProfileActivity_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_action_idx" ON public."ProfileActivity" USING btree (action);


--
-- Name: ProfileActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_createdAt_idx" ON public."ProfileActivity" USING btree ("createdAt");


--
-- Name: ProfileActivity_device_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_device_idx" ON public."ProfileActivity" USING btree (device);


--
-- Name: ProfileActivity_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_entityType_entityId_idx" ON public."ProfileActivity" USING btree ("entityType", "entityId");


--
-- Name: ProfileActivity_profileId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_profileId_idx" ON public."ProfileActivity" USING btree ("profileId");


--
-- Name: ProfileActivity_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_sessionId_idx" ON public."ProfileActivity" USING btree ("sessionId");


--
-- Name: ProfileActivity_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileActivity_type_idx" ON public."ProfileActivity" USING btree (type);


--
-- Name: ProfileAddress_city_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileAddress_city_idx" ON public."ProfileAddress" USING btree (city);


--
-- Name: ProfileAddress_pincode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileAddress_pincode_idx" ON public."ProfileAddress" USING btree (pincode);


--
-- Name: ProfileAddress_profileId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileAddress_profileId_idx" ON public."ProfileAddress" USING btree ("profileId");


--
-- Name: ProfileAddress_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileAddress_type_idx" ON public."ProfileAddress" USING btree (type);


--
-- Name: ProfileCommunication_channel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileCommunication_channel_idx" ON public."ProfileCommunication" USING btree (channel);


--
-- Name: ProfileCommunication_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileCommunication_createdAt_idx" ON public."ProfileCommunication" USING btree ("createdAt");


--
-- Name: ProfileCommunication_profileId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileCommunication_profileId_idx" ON public."ProfileCommunication" USING btree ("profileId");


--
-- Name: ProfileCommunication_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileCommunication_status_idx" ON public."ProfileCommunication" USING btree (status);


--
-- Name: ProfileCommunication_templateId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileCommunication_templateId_idx" ON public."ProfileCommunication" USING btree ("templateId");


--
-- Name: ProfileCommunication_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileCommunication_type_idx" ON public."ProfileCommunication" USING btree (type);


--
-- Name: ProfileDevice_deviceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileDevice_deviceId_idx" ON public."ProfileDevice" USING btree ("deviceId");


--
-- Name: ProfileDevice_deviceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProfileDevice_deviceId_key" ON public."ProfileDevice" USING btree ("deviceId");


--
-- Name: ProfileDevice_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileDevice_isActive_idx" ON public."ProfileDevice" USING btree ("isActive");


--
-- Name: ProfileDevice_isTrusted_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileDevice_isTrusted_idx" ON public."ProfileDevice" USING btree ("isTrusted");


--
-- Name: ProfileDevice_lastSeen_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileDevice_lastSeen_idx" ON public."ProfileDevice" USING btree ("lastSeen");


--
-- Name: ProfileDevice_profileId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileDevice_profileId_idx" ON public."ProfileDevice" USING btree ("profileId");


--
-- Name: ProfileLoyalty_points_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileLoyalty_points_idx" ON public."ProfileLoyalty" USING btree (points);


--
-- Name: ProfileLoyalty_profileId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileLoyalty_profileId_idx" ON public."ProfileLoyalty" USING btree ("profileId");


--
-- Name: ProfileLoyalty_profileId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProfileLoyalty_profileId_key" ON public."ProfileLoyalty" USING btree ("profileId");


--
-- Name: ProfileLoyalty_referralCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileLoyalty_referralCode_idx" ON public."ProfileLoyalty" USING btree ("referralCode");


--
-- Name: ProfileLoyalty_referralCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProfileLoyalty_referralCode_key" ON public."ProfileLoyalty" USING btree ("referralCode");


--
-- Name: ProfileLoyalty_tier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileLoyalty_tier_idx" ON public."ProfileLoyalty" USING btree (tier);


--
-- Name: ProfileNote_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileNote_category_idx" ON public."ProfileNote" USING btree (category);


--
-- Name: ProfileNote_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileNote_createdBy_idx" ON public."ProfileNote" USING btree ("createdBy");


--
-- Name: ProfileNote_followUpAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileNote_followUpAt_idx" ON public."ProfileNote" USING btree ("followUpAt");


--
-- Name: ProfileNote_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileNote_priority_idx" ON public."ProfileNote" USING btree (priority);


--
-- Name: ProfileNote_profileId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileNote_profileId_idx" ON public."ProfileNote" USING btree ("profileId");


--
-- Name: ProfileNote_resolved_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProfileNote_resolved_idx" ON public."ProfileNote" USING btree (resolved);


--
-- Name: Review_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_createdAt_idx" ON public."Review" USING btree ("createdAt");


--
-- Name: Review_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_productId_idx" ON public."Review" USING btree ("productId");


--
-- Name: Review_rating_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_rating_idx" ON public."Review" USING btree (rating);


--
-- Name: Review_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_status_idx" ON public."Review" USING btree (status);


--
-- Name: Review_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_userId_idx" ON public."Review" USING btree ("userId");


--
-- Name: Shipment_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Shipment_orderId_idx" ON public."Shipment" USING btree ("orderId");


--
-- Name: Shipment_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Shipment_orderId_key" ON public."Shipment" USING btree ("orderId");


--
-- Name: Shipment_partnerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Shipment_partnerId_idx" ON public."Shipment" USING btree ("partnerId");


--
-- Name: Shipment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Shipment_status_idx" ON public."Shipment" USING btree (status);


--
-- Name: Shipment_trackingNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Shipment_trackingNumber_idx" ON public."Shipment" USING btree ("trackingNumber");


--
-- Name: Shipment_trackingNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON public."Shipment" USING btree ("trackingNumber");


--
-- Name: Tenant_domain_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tenant_domain_key" ON public."Tenant" USING btree (domain);


--
-- Name: Tenant_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Tenant_slug_idx" ON public."Tenant" USING btree (slug);


--
-- Name: Tenant_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);


--
-- Name: Tenant_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Tenant_status_idx" ON public."Tenant" USING btree (status);


--
-- Name: UserAddress_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserAddress_userId_idx" ON public."UserAddress" USING btree ("userId");


--
-- Name: UserIntelligence_lifecycleStage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserIntelligence_lifecycleStage_idx" ON public."UserIntelligence" USING btree ("lifecycleStage");


--
-- Name: UserIntelligence_ltv_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserIntelligence_ltv_idx" ON public."UserIntelligence" USING btree (ltv);


--
-- Name: UserIntelligence_riskScore_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserIntelligence_riskScore_idx" ON public."UserIntelligence" USING btree ("riskScore");


--
-- Name: UserIntelligence_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserIntelligence_userId_idx" ON public."UserIntelligence" USING btree ("userId");


--
-- Name: UserIntelligence_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserIntelligence_userId_key" ON public."UserIntelligence" USING btree ("userId");


--
-- Name: UserProfile_accountStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_accountStatus_idx" ON public."UserProfile" USING btree ("accountStatus");


--
-- Name: UserProfile_churnRisk_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_churnRisk_idx" ON public."UserProfile" USING btree ("churnRisk");


--
-- Name: UserProfile_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_email_idx" ON public."UserProfile" USING btree (email);


--
-- Name: UserProfile_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserProfile_email_key" ON public."UserProfile" USING btree (email);


--
-- Name: UserProfile_lastActiveAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_lastActiveAt_idx" ON public."UserProfile" USING btree ("lastActiveAt");


--
-- Name: UserProfile_lifetimeValue_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_lifetimeValue_idx" ON public."UserProfile" USING btree ("lifetimeValue");


--
-- Name: UserProfile_loyaltyTier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_loyaltyTier_idx" ON public."UserProfile" USING btree ("loyaltyTier");


--
-- Name: UserProfile_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_phone_idx" ON public."UserProfile" USING btree (phone);


--
-- Name: UserProfile_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserProfile_phone_key" ON public."UserProfile" USING btree (phone);


--
-- Name: UserProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserProfile_userId_key" ON public."UserProfile" USING btree ("userId");


--
-- Name: UserProfile_verificationLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserProfile_verificationLevel_idx" ON public."UserProfile" USING btree ("verificationLevel");


--
-- Name: UserSecurity_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserSecurity_userId_key" ON public."UserSecurity" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_isBlocked_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_isBlocked_idx" ON public."User" USING btree ("isBlocked");


--
-- Name: User_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_phone_idx" ON public."User" USING btree (phone);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: WebhookSubscription_event_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookSubscription_event_isActive_idx" ON public."WebhookSubscription" USING btree (event, "isActive");


--
-- Name: WebhookSubscription_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookSubscription_tenantId_idx" ON public."WebhookSubscription" USING btree ("tenantId");


--
-- Name: WishlistItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WishlistItem_productId_idx" ON public."WishlistItem" USING btree ("productId");


--
-- Name: WishlistItem_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WishlistItem_userId_idx" ON public."WishlistItem" USING btree ("userId");


--
-- Name: WishlistItem_userId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON public."WishlistItem" USING btree ("userId", "productId");


--
-- Name: WorkflowRule_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkflowRule_tenantId_idx" ON public."WorkflowRule" USING btree ("tenantId");


--
-- Name: WorkflowRule_triggerEvent_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkflowRule_triggerEvent_isActive_idx" ON public."WorkflowRule" USING btree ("triggerEvent", "isActive");


--
-- Name: AdminLog AdminLog_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminLog"
    ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgentMessage AgentMessage_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentMessage"
    ADD CONSTRAINT "AgentMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."AgentSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgentProposal AgentProposal_adeDecisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentProposal"
    ADD CONSTRAINT "AgentProposal_adeDecisionId_fkey" FOREIGN KEY ("adeDecisionId") REFERENCES public."AutonomousDecision"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AgentProposal AgentProposal_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentProposal"
    ADD CONSTRAINT "AgentProposal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."AgentSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AutonomousDecision AutonomousDecision_policyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AutonomousDecision"
    ADD CONSTRAINT "AutonomousDecision_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES public."DecisionPolicy"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BusinessConfig BusinessConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessConfig"
    ADD CONSTRAINT "BusinessConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DeliveryAgent DeliveryAgent_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryAgent"
    ADD CONSTRAINT "DeliveryAgent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryReservation InventoryReservation_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryReservation"
    ADD CONSTRAINT "InventoryReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LedgerEntry LedgerEntry_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LedgerEntry LedgerEntry_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LoyaltyTransaction LoyaltyTransaction_loyaltyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES public."ProfileLoyalty"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationTemplate NotificationTemplate_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderAnalytic OrderAnalytic_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderAnalytic"
    ADD CONSTRAINT "OrderAnalytic_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderTimelineEvent OrderTimelineEvent_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderTimelineEvent"
    ADD CONSTRAINT "OrderTimelineEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_deliveryAgentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_deliveryAgentId_fkey" FOREIGN KEY ("deliveryAgentId") REFERENCES public."DeliveryAgent"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OtpSession OtpSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OtpSession"
    ADD CONSTRAINT "OtpSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProfileActivity ProfileActivity_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileActivity"
    ADD CONSTRAINT "ProfileActivity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileAddress ProfileAddress_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileAddress"
    ADD CONSTRAINT "ProfileAddress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileCommunication ProfileCommunication_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileCommunication"
    ADD CONSTRAINT "ProfileCommunication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileDevice ProfileDevice_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileDevice"
    ADD CONSTRAINT "ProfileDevice_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileLoyalty ProfileLoyalty_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileLoyalty"
    ADD CONSTRAINT "ProfileLoyalty_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileNote ProfileNote_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileNote"
    ADD CONSTRAINT "ProfileNote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Shipment Shipment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shipment"
    ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Shipment Shipment_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shipment"
    ADD CONSTRAINT "Shipment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."LogisticsPartner"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserAddress UserAddress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserAddress"
    ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserIntelligence UserIntelligence_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserIntelligence"
    ADD CONSTRAINT "UserIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserProfile UserProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSecurity UserSecurity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSecurity"
    ADD CONSTRAINT "UserSecurity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WebhookSubscription WebhookSubscription_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WebhookSubscription"
    ADD CONSTRAINT "WebhookSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WishlistItem WishlistItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WishlistItem"
    ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WishlistItem WishlistItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WishlistItem"
    ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkflowRule WorkflowRule_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkflowRule"
    ADD CONSTRAINT "WorkflowRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

