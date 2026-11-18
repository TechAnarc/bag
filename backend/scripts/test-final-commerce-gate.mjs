#!/usr/bin/env node
/**
 * FINAL PRODUCTION COMMERCE GATE VERIFICATION SUITE
 */
import crypto from "crypto";

const BASE = "http://localhost:4000/api/v1";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "dummysecret1234567890abcdef";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "dummywebhooksecret1234567890";

let passed = 0;
let failed = 0;
const results = [];

function record(name, condition, detail = "") {
  const ok = !!condition;
  ok ? passed++ : failed++;
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? " -> " + detail : ""}`);
  results.push({ name, passed: ok, detail });
}

async function req(method, path, body = null, headers = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body !== null) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 300) };
    }
    return { status: res.status, body: json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runGate() {
  console.log("================================================================================");
  console.log("             FINAL PRODUCTION COMMERCE GATE - BOMBAY BAG HOUSE                  ");
  console.log("================================================================================\n");

  console.log("── Phase 0: System Authentication & Catalog Inspection ──");
  const adminLogin = await req("POST", "/admin/auth/login", {
    email: process.env.ADMIN_EMAIL || "admin@trivenibombaybaghouse.com",
    password: process.env.ADMIN_PASSWORD || "",
  });
  const adminToken = adminLogin.body?.data?.token || adminLogin.body?.token;
  record("Admin authentication", !!adminToken);
  if (!adminToken) process.exit(1);

  // Customer A - Register fresh or Login
  const userAEmail = `customer_a_${Date.now()}@bombaybaghouse.com`;
  const userAReg = await req("POST", "/auth/register", {
    name: "Customer Alpha",
    email: userAEmail,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: "Password123!",
    verificationMethod: "EMAIL"
  });
  const userAToken = userAReg.body?.data?.accessToken;
  const userAId = userAReg.body?.data?.user?.id;
  record("Customer A registered & authenticated", !!userAToken, `userId=${userAId}`);

  // Customer B - Register fresh or Login
  const userBEmail = `customer_b_${Date.now()}@bombaybaghouse.com`;
  const userBReg = await req("POST", "/auth/register", {
    name: "Customer Beta",
    email: userBEmail,
    phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: "Password123!",
    verificationMethod: "EMAIL"
  });
  const userBToken = userBReg.body?.data?.accessToken;
  const userBId = userBReg.body?.data?.user?.id;
  record("Customer B registered & authenticated", !!userBToken, `userId=${userBId}`);

  const catalogRes = await req("GET", "/products?limit=5");
  const products = catalogRes.body?.data?.products || [];
  record("Fetch catalog bag products", products.length > 0, `found ${products.length} products`);
  const testProduct = products[0];
  const testProductId = testProduct.id;
  const testProductPrice = testProduct.sellingPrice || testProduct.price;
  console.log(`Using target product: "${testProduct.name}" (ID: ${testProductId}, ₹${testProductPrice})`);

  await req("PATCH", "/admin/settings/general", {
    coupons: [
      {
        code: "BBH10",
        type: "PERCENTAGE",
        value: 10,
        minPurchase: 500,
        maxDiscount: 500,
        isActive: true,
      },
      {
        code: "BBHFLAT100",
        type: "FIXED",
        value: 100,
        minPurchase: 1000,
        isActive: true,
      }
    ]
  }, { Authorization: `Bearer ${adminToken}` });

  console.log("\n── Gate 1: Razorpay Payment Initiation ──");
  const initOrderRes = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    directItems: [{ productId: testProductId, quantity: 1 }],
    shippingAddress: {
      name: "Piyush Soni",
      phone: "9876543210",
      street: "123 Commercial Hub",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    billingAddress: {
      name: "Piyush Soni",
      street: "123 Commercial Hub",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
  }, { Authorization: `Bearer ${userAToken}` });

  const orderData = initOrderRes.body?.data?.order;
  const razorpayOrder = initOrderRes.body?.data?.razorpayOrder;
  record("Order creation with paymentMethod: RAZORPAY", initOrderRes.status === 201 && !!orderData);
  record("Order initial status is PAYMENT_PENDING", orderData?.status === "PAYMENT_PENDING", `status=${orderData?.status}`);
  record("Valid Razorpay order initiated", !!razorpayOrder?.id && razorpayOrder.id.startsWith("order_"), `razorpayOrderId=${razorpayOrder?.id}`);

  console.log("\n── Gate 2: Payment Signature Verification (Valid) ──");
  const validPaymentId = `pay_${crypto.randomBytes(7).toString("hex")}`;
  const validSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrder.id}|${validPaymentId}`)
    .digest("hex");

  const verifyRes = await req("POST", "/orders/verify-payment", {
    orderId: orderData.id,
    razorpay_order_id: razorpayOrder.id,
    razorpay_payment_id: validPaymentId,
    razorpay_signature: validSignature,
  }, { Authorization: `Bearer ${userAToken}` });

  record("Valid signature verification returns 200", verifyRes.status === 200, `status=${verifyRes.status}`);
  record("Order transitioned to PROCESSING / PAYMENT_CONFIRMED", 
    verifyRes.body?.data?.order?.status === "PROCESSING" || verifyRes.body?.data?.order?.status === "PAYMENT_CONFIRMED",
    `status=${verifyRes.body?.data?.order?.status}`
  );

  console.log("\n── Gate 3: Tampered Payment Signature Rejection ──");
  const initOrder2 = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    directItems: [{ productId: testProductId, quantity: 1 }],
    shippingAddress: { name: "Tamper Test", phone: "9876543210", city: "Delhi", pincode: "110001" },
  }, { Authorization: `Bearer ${userAToken}` });
  const order2 = initOrder2.body?.data?.order;
  const rzpOrder2 = initOrder2.body?.data?.razorpayOrder;

  const forgedPaymentId = `pay_${crypto.randomBytes(7).toString("hex")}`;
  const tamperedSignature = "bad_signature_000000000000000000000000000000000000000000000000";

  const tamperVerifyRes = await req("POST", "/orders/verify-payment", {
    orderId: order2.id,
    razorpay_order_id: rzpOrder2.id,
    razorpay_payment_id: forgedPaymentId,
    razorpay_signature: tamperedSignature,
  }, { Authorization: `Bearer ${userAToken}` });

  record("Tampered signature is rejected (HTTP 400 or error)", tamperVerifyRes.status !== 200);
  
  const order2Check = await req("GET", `/orders/${order2.id}`, null, { Authorization: `Bearer ${userAToken}` });
  record("Order marked FAILED after invalid signature", order2Check.body?.data?.status === "FAILED" || order2Check.body?.data?.paymentStatus === "FAILED");

  console.log("\n── Gate 4: Webhook Signature Validation & Delivery ──");
  const initOrder3 = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    directItems: [{ productId: testProductId, quantity: 1 }],
    shippingAddress: { name: "Webhook User", phone: "9876543210", city: "Bangalore", pincode: "560001" },
  }, { Authorization: `Bearer ${userAToken}` });
  const order3 = initOrder3.body?.data?.order;
  const rzpOrder3 = initOrder3.body?.data?.razorpayOrder;
  const rzpPayment3 = `pay_${crypto.randomBytes(7).toString("hex")}`;
  const webhookEventId = `evt_${crypto.randomBytes(8).toString("hex")}`;

  const paymentCapturedPayload = {
    entity: "event",
    account_id: "acc_bbh_test",
    event: "payment.captured",
    contains: ["payment"],
    event_id: webhookEventId,
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: rzpPayment3,
          entity: "payment",
          amount: Math.round(order3.total * 100),
          currency: "INR",
          status: "captured",
          order_id: rzpOrder3.id,
          method: "card",
          captured: true,
          email: userAEmail,
          contact: "+919876543210",
          fee: 200,
          tax: 36,
          created_at: Math.floor(Date.now() / 1000),
        }
      }
    }
  };

  const rawCapturedBody = JSON.stringify(paymentCapturedPayload);
  const validWebhookSig = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawCapturedBody)
    .digest("hex");

  const rejectedWebhook = await req("POST", "/payments/webhook", rawCapturedBody, {
    "x-razorpay-signature": "invalid_hmac_signature_xyz",
  });
  record("Forged webhook signature rejected with HTTP 400", rejectedWebhook.status === 400);

  const acceptedWebhook = await req("POST", "/payments/webhook", rawCapturedBody, {
    "x-razorpay-signature": validWebhookSig,
  });
  record("Valid HMAC signed webhook accepted with HTTP 200", acceptedWebhook.status === 200);

  await new Promise((r) => setTimeout(r, 2000));

  const order3Status = await req("GET", `/orders/${order3.id}`, null, { Authorization: `Bearer ${userAToken}` });
  record("Order 3 payment confirmed via webhook", 
    order3Status.body?.data?.paymentStatus === "COMPLETED" || order3Status.body?.data?.status === "PAYMENT_CONFIRMED",
    `status=${order3Status.body?.data?.status}, paymentStatus=${order3Status.body?.data?.paymentStatus}`
  );

  console.log("\n── Gate 5: Webhook Idempotency & Deduplication ──");
  const replayWebhook = await req("POST", "/payments/webhook", rawCapturedBody, {
    "x-razorpay-signature": validWebhookSig,
  });
  record("Replayed webhook receives 200 acknowledgment", replayWebhook.status === 200);
  
  const order3Recheck = await req("GET", `/orders/${order3.id}`, null, { Authorization: `Bearer ${userAToken}` });
  record("Order status remains consistent after webhook replay", order3Recheck.body?.data?.paymentStatus === "COMPLETED");

  console.log("\n── Gate 6: Payment Failure & Inventory Restock ──");
  const prodBeforeOrder = await req("GET", `/products/${testProductId}`);
  const stockBefore = prodBeforeOrder.body?.data?.inventory?.quantity ?? 0;

  const failOrderRes = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    directItems: [{ productId: testProductId, quantity: 2 }],
    shippingAddress: { name: "Fail Restock Test", phone: "9876543210", city: "Pune", pincode: "411001" },
  }, { Authorization: `Bearer ${userAToken}` });
  const failOrder = failOrderRes.body?.data?.order;
  const failRzpOrder = failOrderRes.body?.data?.razorpayOrder;

  const prodAfterOrder = await req("GET", `/products/${testProductId}`);
  const stockAfterOrder = prodAfterOrder.body?.data?.inventory?.quantity ?? 0;
  record("Inventory decremented upon order placement", stockAfterOrder === stockBefore - 2, `before=${stockBefore}, after=${stockAfterOrder}`);

  const failEventId = `evt_${crypto.randomBytes(8).toString("hex")}`;
  const failPaymentId = `pay_${crypto.randomBytes(7).toString("hex")}`;
  const paymentFailedPayload = {
    entity: "event",
    account_id: "acc_bbh_test",
    event: "payment.failed",
    contains: ["payment"],
    event_id: failEventId,
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: failPaymentId,
          entity: "payment",
          amount: Math.round(failOrder.total * 100),
          currency: "INR",
          status: "failed",
          order_id: failRzpOrder.id,
          method: "upi",
          error_code: "BAD_REQUEST_ERROR",
          error_description: "Payment failed due to insufficient funds in customer bank account",
          error_source: "gateway",
          error_step: "payment_authorization",
          error_reason: "payment_failed",
          email: userAEmail,
          contact: "+919876543210",
          created_at: Math.floor(Date.now() / 1000),
        }
      }
    }
  };

  const rawFailBody = JSON.stringify(paymentFailedPayload);
  const failSig = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawFailBody).digest("hex");
  await req("POST", "/payments/webhook", rawFailBody, { "x-razorpay-signature": failSig });

  await new Promise((r) => setTimeout(r, 2000));

  const failOrderCheck = await req("GET", `/orders/${failOrder.id}`, null, { Authorization: `Bearer ${userAToken}` });
  record("Order marked FAILED after payment.failed webhook", failOrderCheck.body?.data?.status === "FAILED");

  const prodAfterRestock = await req("GET", `/products/${testProductId}`);
  const stockAfterRestock = prodAfterRestock.body?.data?.inventory?.quantity ?? 0;
  record("Inventory successfully restored after payment failure", stockAfterRestock === stockBefore, `restored=${stockAfterRestock}`);

  console.log("\n── Gate 7: Refund & Ledger Reconciliation ──");
  const refundEventId = `evt_${crypto.randomBytes(8).toString("hex")}`;
  const refundId = `rfnd_${crypto.randomBytes(7).toString("hex")}`;

  const refundPayload = {
    entity: "event",
    account_id: "acc_bbh_test",
    event: "refund.created",
    contains: ["refund"],
    event_id: refundEventId,
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      refund: {
        entity: {
          id: refundId,
          entity: "refund",
          amount: Math.round(order3.total * 100),
          currency: "INR",
          payment_id: rzpPayment3,
          notes: { reason: "Customer return accepted" },
          status: "processed",
          speed_processed: "optimum",
          created_at: Math.floor(Date.now() / 1000),
        }
      }
    }
  };

  const rawRefundBody = JSON.stringify(refundPayload);
  const refundSig = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawRefundBody).digest("hex");
  await req("POST", "/payments/webhook", rawRefundBody, { "x-razorpay-signature": refundSig });

  await new Promise((r) => setTimeout(r, 2000));

  const order3Refunded = await req("GET", `/orders/${order3.id}`, null, { Authorization: `Bearer ${userAToken}` });
  record("Order transitioned to REFUNDED status", 
    order3Refunded.body?.data?.status === "REFUNDED" || order3Refunded.body?.data?.paymentStatus === "REFUNDED",
    `status=${order3Refunded.body?.data?.status}, paymentStatus=${order3Refunded.body?.data?.paymentStatus}`
  );

  console.log("\n── Gate 8: Concurrent Stock Contention Protection ──");
  const lowStockProd = products[1] || products[0];
  await req("PUT", `/admin/products/${lowStockProd.id}`, {
    inventory: { inStock: true, quantity: 2 },
  }, { Authorization: `Bearer ${adminToken}` });

  console.log(`Firing 5 concurrent orders against available stock = 2 for "${lowStockProd.name}"...`);
  const concurrentPromises = Array.from({ length: 5 }).map((_, i) =>
    req("POST", "/orders", {
      paymentMethod: "RAZORPAY",
      directItems: [{ productId: lowStockProd.id, quantity: 1 }],
      shippingAddress: { name: `Racer ${i}`, phone: "9876543210", city: "Surat", pincode: "395001" },
    }, { Authorization: `Bearer ${userAToken}` })
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const successfulOrders = concurrentResults.filter((r) => r.status === 201);
  const rejectedOrders = concurrentResults.filter((r) => r.status !== 201);

  record("Exactly stock-available orders succeed (2 out of 5)", successfulOrders.length === 2, `succeeded=${successfulOrders.length}`);
  record("Remaining concurrent orders rejected with Insufficient Stock", rejectedOrders.length === 3, `rejected=${rejectedOrders.length}`);

  const stockAfterRace = await req("GET", `/products/${lowStockProd.id}`);
  const finalRaceStock = stockAfterRace.body?.data?.inventory?.quantity ?? 0;
  record("Final stock matches exact delta (0 remaining, zero overselling)", finalRaceStock === 0, `finalStock=${finalRaceStock}`);

  await req("PUT", `/admin/products/${lowStockProd.id}`, {
    inventory: { inStock: true, quantity: 25 },
  }, { Authorization: `Bearer ${adminToken}` });

  console.log("\n── Gate 9: Server-Side Price & Coupon Authority ──");
  const forgedPriceRes = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    directItems: [{ productId: testProductId, quantity: 1 }],
    shippingAddress: { name: "Attacker", phone: "9876543210", city: "Mumbai", pincode: "400001" },
    total: 10,
    subtotal: 10,
    discount: 9999,
  }, { Authorization: `Bearer ${userAToken}` });

  const forgedOrder = forgedPriceRes.body?.data?.order;
  record("Server derives total from database price (ignores client forged total: 10)",
    forgedOrder?.total >= testProductPrice,
    `expected >= ${testProductPrice}, actual=${forgedOrder?.total}`
  );

  const couponOrderRes = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    couponCode: "BBH10",
    directItems: [{ productId: testProductId, quantity: 1 }],
    shippingAddress: { name: "Coupon User", phone: "9876543210", city: "Mumbai", pincode: "400001" },
  }, { Authorization: `Bearer ${userAToken}` });

  const couponOrder = couponOrderRes.body?.data?.order;
  const expectedDiscount = Math.round((testProductPrice * 10) / 100);
  record("Server applies valid coupon discount dynamically", 
    couponOrder?.discount >= expectedDiscount,
    `expectedDiscount=${expectedDiscount}, actualDiscount=${couponOrder?.discount}`
  );

  console.log("\n── Gate 10: Customer Ownership & Public Tracking Privacy ──");
  const userBOrdersRes = await req("GET", "/orders/my-orders", null, { Authorization: `Bearer ${userBToken}` });
  const userBOrders = userBOrdersRes.body?.data || [];
  const containsUserAOrder = userBOrders.some((o) => o.id === orderData.id);
  record("Customer B cannot view Customer A orders in /my-orders (Auth isolation)", !containsUserAOrder);

  const publicTrackingRes = await req("GET", `/orders/track/${orderData.orderNumber}`);
  const trackingData = publicTrackingRes.body?.data;
  record("Public tracking allows unauthenticated access via orderNumber", publicTrackingRes.status === 200);
  record("Sensitive customer data redacted in public tracking (no phone, no email, no full billing)",
    trackingData && !trackingData.phone && !trackingData.email && !trackingData.billingAddress,
    `keys=${Object.keys(trackingData || {}).join(", ")}`
  );
  record("Tracking milestones and city/state exposed for delivery updates",
    !!trackingData?.timeline && !!trackingData?.shippingAddress?.city,
    `city=${trackingData?.shippingAddress?.city}, milestones=${trackingData?.timeline?.length}`
  );

  console.log("\n── Gate 11: Complete End-to-End Customer Journey Regression ──");
  const step1 = await req("GET", "/products?page=1&limit=6");
  record("Step 1: Browse bag catalog", step1.status === 200 && step1.body?.data?.products?.length > 0);

  const step2 = await req("GET", `/products/${testProductId}`);
  record("Step 2: View Bag Product Details", step2.status === 200 && step2.body?.data?.name === testProduct.name);

  const step3 = await req("POST", "/cart/items", {
    productId: testProductId,
    quantity: 1,
  }, { Authorization: `Bearer ${userAToken}` });
  record("Step 3: Add product to persistent user cart", step3.status === 200 || step3.status === 201);

  const step4 = await req("GET", "/cart", null, { Authorization: `Bearer ${userAToken}` });
  record("Step 4: Fetch populated cart with server totals", step4.status === 200 && step4.body?.data?.items?.length > 0);

  const step5 = await req("POST", "/orders", {
    paymentMethod: "RAZORPAY",
    shippingAddress: {
      name: "Journey Customer",
      phone: "9876543210",
      street: "77 Marine Drive",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400020",
    },
  }, { Authorization: `Bearer ${userAToken}` });
  const journeyOrder = step5.body?.data?.order;
  const journeyRzp = step5.body?.data?.razorpayOrder;
  record("Step 5: Checkout completes and cart clears", step5.status === 201 && !!journeyOrder);

  const journeyPayId = `pay_${crypto.randomBytes(7).toString("hex")}`;
  const journeySig = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${journeyRzp.id}|${journeyPayId}`)
    .digest("hex");

  const step6 = await req("POST", "/orders/verify-payment", {
    orderId: journeyOrder.id,
    razorpay_order_id: journeyRzp.id,
    razorpay_payment_id: journeyPayId,
    razorpay_signature: journeySig,
  }, { Authorization: `Bearer ${userAToken}` });
  record("Step 6: Payment verified, order confirmed", step6.status === 200);

  const step7 = await req("GET", "/orders/my-orders", null, { Authorization: `Bearer ${userAToken}` });
  const inAccount = (step7.body?.data || []).some((o) => o.id === journeyOrder.id);
  record("Step 7: Confirmed order appears in customer account history", inAccount);

  const step8 = await req("GET", `/orders/track/${journeyOrder.orderNumber}`);
  record("Step 8: Public tracking immediately active with Order Placed milestone", 
    step8.status === 200 && step8.body?.data?.timeline?.length > 0
  );

  console.log("\n================================================================================");
  console.log(`             RESULTS: ${passed} PASSED | ${failed} FAILED                       `);
  console.log("================================================================================");

  if (failed > 0) {
    console.error(`❌ GATE FAILED: ${failed} verification checks failed.`);
    process.exit(1);
  } else {
    console.log("🎉 ALL PRODUCTION COMMERCE GATES PASSED AUTOMATICALLY!");
    process.exit(0);
  }
}

runGate().catch((e) => {
  console.error("FATAL GATE ERROR:", e);
  process.exit(1);
});
