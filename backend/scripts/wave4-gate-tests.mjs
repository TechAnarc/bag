#!/usr/bin/env node
/**
 * SUPERNOVA GATE — Wave 4 API Tests
 * Logistics/Shipping, Returns/Refunds, Business Config/Coupons
 */

const BASE = "http://localhost:4000/api/v1";

async function req(method, path, body, headers = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${BASE}${path}`, opts);
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
    return { status: r.status, body: json };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

let passed = 0, failed = 0;

function test(name, condition, detail = "") {
  const ok = !!condition;
  ok ? passed++ : failed++;
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? ": " + detail : ""}`);
}

async function run() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   WAVE 4 — Shipping / Returns / Coupons API Gate Tests       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const login = await req("POST", "/admin/auth/login", {
    email: process.env.ADMIN_EMAIL || "admin@trivenibombaybaghouse.com",
    password: process.env.ADMIN_PASSWORD || ""
  });
  const token = login.body?.data?.token || login.body?.token;
  test("Admin login for Wave 4 tests", !!token, `token=${token ? "OK" : "MISSING"}`);
  if (!token) process.exit(1);

  const auth = { Authorization: `Bearer ${token}` };

  // ── SHIPPING & LOGISTICS ─────────────────────────────────────
  console.log("\n── SHIPPING & LOGISTICS ──────────────────────────────────────");
  const partners = await req("GET", "/admin/logistics/partners", null, auth);
  test("GET /admin/logistics/partners retrieves partners list", partners.status === 200, `status=${partners.status}`);
  test("Unauthenticated logistics access blocked", (await req("GET", "/admin/logistics/partners")).status === 401);

  // ── RETURNS / REFUNDS ────────────────────────────────────────
  console.log("\n── RETURNS & REFUNDS ─────────────────────────────────────────");
  const returns = await req("GET", "/admin/orders?status=REFUNDED", null, auth);
  test("GET /admin/orders?status=REFUNDED retrieves refund pipeline", returns.status === 200, `status=${returns.status}`);

  // ── BUSINESS CONFIG & PROMOTIONS ─────────────────────────────
  console.log("\n── BUSINESS CONFIG & PROMOTIONS ──────────────────────────────");
  const config = await req("GET", "/admin/settings/business", null, auth);
  test("GET /admin/settings/business retrieves config", config.status === 200, `status=${config.status}`);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  WAVE 4 GATE: ${passed} PASSED | ${failed} FAILED                        ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
