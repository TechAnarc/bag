import assert from 'node:assert';

const API_BASE = 'http://localhost:4000/api/v1';

async function runTests() {
  console.log('?? Running Storefront & Checkout Cutover Test Suite...\n');

  // TEST 1: Public Catalog Browse & Bag Domain Verification
  console.log('Test 1: Public Catalog Browse...');
  const catRes = await fetch(API_BASE + '/categories');
  const catJson = await catRes.json();
  assert.strictEqual(catJson.success, true, 'Categories API failed');
  assert.ok(Array.isArray(catJson.data) && catJson.data.length >= 10, 'Must have at least 10 categories');
  console.log('  ? Categories verified (' + catJson.data.length + ' bag categories found)');

  const prodRes = await fetch(API_BASE + '/products?limit=20');
  const prodJson = await prodRes.json();
  assert.strictEqual(prodJson.success, true, 'Products API failed');
  const products = prodJson.data.products;
  assert.ok(products.length >= 1, 'Must have products seeded');
  
  // Verify strictly bag domain, zero jewelry
  for (const p of products) {
    const raw = JSON.stringify(p).toLowerCase();
    assert.ok(!raw.includes('gold plated') && !raw.includes('jewel') && !raw.includes('karat'), 'Contamination in ' + p.name);
  }
  console.log('  ? Zero jewellery contamination in catalog products');

  const sampleProduct = products[0];
  console.log('  ? Sample bag: "' + sampleProduct.name + '" (Selling: ?' + sampleProduct.sellingPrice + ', Stock: ' + sampleProduct.inventory?.quantity + ')');

  // TEST 2: Product Detail by Slug
  console.log('\nTest 2: Product Detail by Slug...');
  const slugRes = await fetch(API_BASE + '/products/slug/' + sampleProduct.slug);
  const slugJson = await slugRes.json();
  assert.strictEqual(slugJson.success, true, 'Slug API failed');
  assert.strictEqual(slugJson.data.id, sampleProduct.id, 'Product slug match failed');
  console.log('  ? Slug lookup succeeded for "' + sampleProduct.slug + '"');

  // TEST 3: Authoritative Order Placement & Stock Decrement
  console.log('\nTest 3: Authoritative Order Creation & Transaction Integrity...');
  const initialStock = sampleProduct.inventory?.quantity || 25;
  const orderPayload = {
    paymentMethod: 'COD',
    shippingAddress: {
      fullName: 'Piyush Soni',
      email: 'customer.test@bombaybaghouse.com',
      mobile: '9876543210',
      addressLine1: '42 Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400020',
      country: 'India',
    },
    customerNotes: 'Delivery Slot: Express',
    items: [
      { productId: sampleProduct.id, quantity: 2 }
    ],
    deliveryMethod: 'SHIP'
  };

  const orderRes = await fetch(API_BASE + '/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  const orderJson = await orderRes.json();
  assert.strictEqual(orderJson.success, true, 'Order placement failed: ' + JSON.stringify(orderJson));
  const createdOrder = orderJson.data.order;
  assert.ok(createdOrder.orderNumber.startsWith('BBH'), 'Order number must start with BBH, got ' + createdOrder.orderNumber);
  console.log('  ? Created Order #' + createdOrder.orderNumber);
  console.log('  ? Server calculated total: ?' + createdOrder.total + ' (Item total: ?' + createdOrder.subtotal + ')');

  // Verify stock was decremented in database
  const refreshedProdRes = await fetch(API_BASE + '/products/' + sampleProduct.id);
  const refreshedProdJson = await refreshedProdRes.json();
  const newStock = refreshedProdJson.data.inventory?.quantity;
  assert.strictEqual(newStock, initialStock - 2, 'Stock must be decremented by 2. Before: ' + initialStock + ', Now: ' + newStock);
  console.log('  ? Stock securely decremented from ' + initialStock + ' to ' + newStock);

  // TEST 4: Price Tampering Rejection
  console.log('\nTest 4: Client Price Tamper Rejection (Server Price Authority)...');
  const tamperPayload = {
    ...orderPayload,
    items: [
      { productId: sampleProduct.id, quantity: 1, price: 1 }
    ]
  };
  const tamperRes = await fetch(API_BASE + '/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tamperPayload)
  });
  const tamperJson = await tamperRes.json();
  assert.strictEqual(tamperJson.success, true);
  const tamperOrder = tamperJson.data.order;
  assert.strictEqual(tamperOrder.items[0].price, sampleProduct.sellingPrice, 'Server must override client price with db price');
  console.log('  ? Client price tampering completely overridden by Server Authority (charged ?' + tamperOrder.items[0].price + ', not ?1)');

  // TEST 5: Public Order Tracking
  console.log('\nTest 5: Public Tracking Flow...');
  const trackRes = await fetch(API_BASE + '/orders/track/' + createdOrder.orderNumber);
  const trackJson = await trackRes.json();
  assert.strictEqual(trackJson.success, true, 'Tracking API failed');
  assert.strictEqual(trackJson.data.orderNumber, createdOrder.orderNumber);
  assert.ok(Array.isArray(trackJson.data.timeline) && trackJson.data.timeline.length >= 1);
  console.log('  ? Public order tracking verified for #' + createdOrder.orderNumber + ' (Status: ' + trackJson.data.status + ')');

  console.log('\n?? ALL STOREFRONT & CHECKOUT CUTOVER TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch(err => {
  console.error('\n? Test failure:', err);
  process.exit(1);
});
