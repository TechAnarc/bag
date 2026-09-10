#!/usr/bin/env node
/**
 * SUPERNOVA GATE — Wave 5 API Tests
 * Analytics, Settings/BusinessConfig, Inquiries, Profile/Security
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
  console.log("║    WAVE 5 — Analytics / Settings / Inquiries Gate Tests      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const login = await req("POST", "/admin/auth/login", {
    email: "admin@trivenibombaybaghouse.com",
    password: "Mahakali1432"
  });
  const token = login.body?.data?.token || login.body?.token;
  test("Admin login for Wave 5 tests", !!token, `token=${token ? "OK" : "MISSING"}`);
  if (!token) process.exit(1);

  const auth = { Authorization: `Bearer ${token}` };

  // ── ANALYTICS ────────────────────────────────────────────────
  console.log("\n── ANALYTICS & TELEMETRY ─────────────────────────────────────");
  const chartData = await req("GET", "/admin/stats/chart?days=14", null, auth);
  test("GET /admin/stats/chart returns 14-day telemetry", chartData.status === 200, `status=${chartData.status}`);
  test("Unauthenticated analytics access blocked", (await req("GET", "/admin/stats/chart")).status === 401);

  const metrics = await req("GET", "/admin/surveillance/metrics", null, auth);
  test("GET /admin/surveillance/metrics returns system velocity", metrics.status === 200, `status=${metrics.status}`);

  // ── INQUIRIES ────────────────────────────────────────────────
  console.log("\n── CONTACT INQUIRIES ─────────────────────────────────────────");
  const inq = await req("GET", "/contact", null, auth);
  test("GET /contact retrieves contact submissions", inq.status === 200, `status=${inq.status}`);
  test("Unauthenticated contact submissions access blocked", (await req("GET", "/contact")).status === 401);

  // ── SETTINGS & PROFILE ───────────────────────────────────────
  console.log("\n── SETTINGS & PROFILE ────────────────────────────────────────");
  const profile = await req("GET", "/admin/profile", null, auth);
  test("GET /admin/profile retrieves admin details", profile.status === 200, `role=${profile.body?.data?.role}`);

  const updateSettings = await req("PUT", "/admin/settings/business", {
    businessName: "Bombay Bag House",
    phone: "+91 98765 43210",
    invoicePrefix: "BBH-INV"
  }, auth);
  test("PUT /admin/settings/business updates configuration", updateSettings.status === 200, `status=${updateSettings.status}`);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  WAVE 5 GATE: ${passed} PASSED | ${failed} FAILED                        ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
