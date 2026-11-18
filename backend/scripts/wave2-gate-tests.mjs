#!/usr/bin/env node
/**
 * SUPERNOVA GATE — Wave 2 API Tests
 * Products, Categories, Inventory
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

let token = null;
let passed = 0, failed = 0;

function test(name, condition, detail = "") {
  const ok = !!condition;
  ok ? passed++ : failed++;
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? ": " + detail : ""}`);
}

async function run() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  WAVE 2 — Products / Categories / Inventory API Gate Tests  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Login first
  const login = await req("POST", "/admin/auth/login", {
    email: process.env.ADMIN_EMAIL || "admin@trivenibombaybaghouse.com",
    password: process.env.ADMIN_PASSWORD || ""
  });
  token = login.body?.data?.token || login.body?.token;
  test("Admin login for Wave 2 tests", !!token, `token=${token ? "OK" : "MISSING"}`);
  if (!token) { console.log("ABORT: No token"); process.exit(1); }

  const auth = { Authorization: `Bearer ${token}` };

  // ── CATEGORIES ─────────────────────────────────────────────────
  console.log("\n── CATEGORIES ────────────────────────────────────────────────");

  const catList = await req("GET", "/categories");
  test("GET /categories is public", catList.status === 200, `status=${catList.status}`);

  // Create a test category
  const catCreate = await req("POST", "/categories", { name: "Test Tote Bags Gate", isActive: true }, auth);
  test("POST /categories creates with admin auth", catCreate.status === 200 || catCreate.status === 201,
    `status=${catCreate.status}, msg=${catCreate.body?.message}`);
  const catId = catCreate.body?.data?.id;
  test("Category create returns an id", !!catId, `id=${catId}`);

  // Unauthorized category create
  const catCreateUnauth = await req("POST", "/categories", { name: "Unauth Test" });
  test("POST /categories blocked without auth", catCreateUnauth.status === 401, `status=${catCreateUnauth.status}`);

  // Update category
  if (catId) {
    const catUpdate = await req("PUT", `/categories/${catId}`, { name: "Test Tote Bags Updated", isActive: true }, auth);
    test("PUT /categories/:id updates", catUpdate.status === 200, `status=${catUpdate.status}`);
  }

  // Get by id
  if (catId) {
    const catGet = await req("GET", `/categories/${catId}`);
    test("GET /categories/:id retrieves created category", catGet.status === 200, `status=${catGet.status}, name=${catGet.body?.data?.name}`);
  }

  // ── PRODUCTS ────────────────────────────────────────────────────
  console.log("\n── PRODUCTS ──────────────────────────────────────────────────");

  const prodList = await req("GET", "/products");
  test("GET /products is public", prodList.status === 200, `status=${prodList.status}`);

  const prodListAdmin = await req("GET", "/admin/products", null, auth);
  test("GET /admin/products (admin list with pagination)", prodListAdmin.status === 200,
    `status=${prodListAdmin.status}, count=${JSON.stringify(prodListAdmin.body?.data)?.slice(0, 60)}`);

  // Create test product
  const newProduct = {
    name: "Gate Test Tote Bag",
    sku: "BBH-GATE-001",
    sellingPrice: 1999,
    basePrice: 2499,
    stock: 50,
    lowStockThreshold: 5,
    status: "ACTIVE",
    categoryId: catId || undefined,
    description: "A gate test bag for Bombay Bag House",
    shortTagline: "Tested. Trusted. Timeless.",
    specifications: {
      material: "Canvas",
      capacity: "20L",
      dimensions: "40x30x15 cm",
      compartments: 3,
      closureType: "Zipper",
      strapType: "Double",
      laptopCompatible: true,
      waterResistant: false,
      color: "Tan",
      weight: "800g"
    }
  };

  const prodCreate = await req("POST", "/admin/products", newProduct, auth);
  test("POST /admin/products creates bag product", prodCreate.status === 200 || prodCreate.status === 201,
    `status=${prodCreate.status}, msg=${prodCreate.body?.message}`);
  const prodId = prodCreate.body?.data?.id;
  test("Product create returns id", !!prodId, `id=${prodId}`);

  // Verify no jewellery fields leaked
  const prodData = prodCreate.body?.data;
  test("Product has no jewellery-specific fields", 
    !prodData?.goldWeight && !prodData?.purity && !prodData?.carat && !prodData?.ringSize,
    "goldWeight/purity/carat/ringSize all absent");
  test("Product specifications include bag attributes",
    prodData?.specifications?.material === "Canvas" || prodData?.specifications?.material !== undefined,
    `material=${prodData?.specifications?.material}`);

  // Block unauthenticated product create
  const prodCreateUnauth = await req("POST", "/admin/products", { name: "Unauth" });
  test("POST /admin/products blocked without auth", prodCreateUnauth.status === 401, `status=${prodCreateUnauth.status}`);

  // Update product
  if (prodId) {
    const prodUpdate = await req("PUT", `/admin/products/${prodId}`, { stock: 75, status: "ACTIVE" }, auth);
    test("PUT /admin/products/:id updates stock", prodUpdate.status === 200, `status=${prodUpdate.status}`);
  }

  // Get product by slug/id
  if (prodId) {
    const prodGet = await req("GET", `/products/${prodId}`);
    test("GET /products/:id returns product", prodGet.status === 200, `status=${prodGet.status}, name=${prodGet.body?.data?.name}`);
  }

  // Search
  const prodSearch = await req("GET", "/products/search?q=tote");
  test("GET /products/search works", prodSearch.status === 200, `status=${prodSearch.status}`);

  // ── INVENTORY ───────────────────────────────────────────────────
  console.log("\n── INVENTORY ─────────────────────────────────────────────────");

  const invList = await req("GET", "/admin/products?limit=50", null, auth);
  test("Admin product list for inventory view", invList.status === 200, `status=${invList.status}`);

  // Stock adjustment via product update
  if (prodId) {
    const stockAdj = await req("PUT", `/admin/products/${prodId}`, { stock: 3 }, auth);
    test("Stock adjustment: set to 3 (low stock threshold)", stockAdj.status === 200, `status=${stockAdj.status}`);

    const stockZero = await req("PUT", `/admin/products/${prodId}`, { stock: 0 }, auth);
    test("Stock adjustment: set to 0 (out of stock)", stockZero.status === 200, `status=${stockZero.status}`);
  }

  // ── CLEANUP ─────────────────────────────────────────────────────
  console.log("\n── CLEANUP ───────────────────────────────────────────────────");
  if (prodId) {
    const del = await req("DELETE", `/admin/products/${prodId}`, null, auth);
    test("DELETE /admin/products/:id removes test product", del.status === 200, `status=${del.status}`);
  }
  if (catId) {
    const catDel = await req("DELETE", `/categories/${catId}`, null, auth);
    test("DELETE /categories/:id removes test category", catDel.status === 200, `status=${catDel.status}`);
  }

  // ── SUMMARY ─────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  WAVE 2 GATE: ${passed} PASSED | ${failed} FAILED                        ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
