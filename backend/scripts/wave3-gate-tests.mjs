#!/usr/bin/env node
/**
 * SUPERNOVA GATE — Wave 3 API Tests
 * Orders, Customers, Reviews
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
  console.log("║    WAVE 3 — Orders / Customers / Reviews API Gate Tests     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const login = await req("POST", "/admin/auth/login", {
    email: process.env.ADMIN_EMAIL || "admin@trivenibombaybaghouse.com",
    password: process.env.ADMIN_PASSWORD || ""
  });
  const token = login.body?.data?.token || login.body?.token;
  test("Admin login for Wave 3 tests", !!token, `token=${token ? "OK" : "MISSING"}`);
  if (!token) process.exit(1);

  const auth = { Authorization: `Bearer ${token}` };

  // ── ORDERS ───────────────────────────────────────────────────
  console.log("\n── ORDERS ────────────────────────────────────────────────────");
  const orders = await req("GET", "/admin/orders?limit=10", null, auth);
  test("GET /admin/orders retrieves orders list", orders.status === 200, `status=${orders.status}`);
  test("Unauthenticated orders access blocked", (await req("GET", "/admin/orders")).status === 401);

  // ── CUSTOMERS ────────────────────────────────────────────────
  console.log("\n── CUSTOMERS ─────────────────────────────────────────────────");
  const users = await req("GET", "/admin/users?limit=10", null, auth);
  test("GET /admin/users retrieves customers list", users.status === 200, `status=${users.status}`);
  test("Unauthenticated users access blocked", (await req("GET", "/admin/users")).status === 401);

  // ── REVIEWS ──────────────────────────────────────────────────
  console.log("\n── REVIEWS ───────────────────────────────────────────────────");
  const reviews = await req("GET", "/reviews/admin", null, auth);
  test("GET /reviews/admin retrieves reviews", reviews.status === 200, `status=${reviews.status}`);
  test("Unauthenticated reviews moderation blocked", (await req("GET", "/reviews/admin")).status === 401);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  WAVE 3 GATE: ${passed} PASSED | ${failed} FAILED                        ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
