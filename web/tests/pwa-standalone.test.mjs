import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api } from '../src/services/api.ts';
import { localDb } from '../src/services/localDatabase.ts';

// In-memory mock localStorage for Node.js test environment
const memoryStore = new Map();
const mockLocalStorage = {
  getItem: (k) => memoryStore.get(k) || null,
  setItem: (k, v) => memoryStore.set(k, String(v)),
  removeItem: (k) => memoryStore.delete(k),
  clear: () => memoryStore.clear(),
};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {},
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: mockLocalStorage,
});

test('PWA Standalone: Admin and Staff can both log in offline', async () => {
  mockLocalStorage.clear();

  const adminAuth = await api.login({ username: 'admin', password: 'AdminPassword@123' });
  assert.equal(adminAuth.user.role, 'ADMIN');
  assert.equal(adminAuth.user.username, 'admin');

  const staffAuth = await api.login({ username: 'sp_rajesh', password: 'Sales@123Rajesh' });
  assert.equal(staffAuth.user.role, 'SALESPERSON');
  assert.equal(staffAuth.user.username, 'sp_rajesh');
});

test('PWA Standalone: Retrieves pre-seeded retailers and calculates totals', async () => {
  await api.login({ username: 'admin', password: 'AdminPassword@123' });
  const res = await api.getShops({ page: 1, limit: 10 });
  assert.ok(res.data.length >= 6, 'Pre-seeded shops should exist');
  assert.ok(res.total >= 6);

  const shop1 = await api.getShopById('shop_1');
  assert.equal(shop1.name, 'Maa Tarini Store');
  assert.ok(shop1.orders.length > 0, 'Orders should be loaded with shop');
  assert.equal(shop1.baki, shop1.totalAmount - shop1.paidAmount);
});

test('PWA Standalone: Onboarding new retailer persists locally', async () => {
  const newShop = await api.createShop({
    name: 'New Test Store',
    location: 'Patia, Bhubaneswar',
    ownerName: 'Sunil Kumar',
    contactNumber: '9988776655',
    openingOrderProduct: 'Mixture Pack 500g',
    openingOrderQuantity: 50,
    openingOrderPrice: 120,
    initialPaidAmount: 2000,
  });

  assert.equal(newShop.name, 'New Test Store');
  assert.equal(newShop.totalAmount, 6000);
  assert.equal(newShop.paidAmount, 2000);
  assert.equal(newShop.baki, 4000);

  // Retrieve from list
  const list = await api.getShops({ search: 'New Test Store' });
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].baki, 4000);
});

test('PWA Standalone: Repeat order and payment collection updates BAKI correctly', async () => {
  const shop = (await api.getShops({ search: 'New Test Store' })).data[0];
  
  // Add repeat order
  const order = await api.addOrder(shop.id, {
    product: 'Besan Laddu 250g',
    quantity: 10,
    unitPrice: 85,
    notes: 'Repeat order',
  });
  assert.equal(order.totalAmount, 850);
  assert.equal(order.baki, 850);

  // Collect partial payment
  const { payment, order: updatedOrder } = await api.payOrder(order.id, 500, 'Partial cash');
  assert.equal(payment.amount, 500);
  assert.equal(updatedOrder.paidAmount, 500);
  assert.equal(updatedOrder.baki, 350);

  // Check shop updated BAKI
  const updatedShop = await api.getShopById(shop.id);
  assert.equal(updatedShop.baki, 4000 + 350);
});

test('PWA Standalone: Dashboard aggregates metrics from local database', async () => {
  await api.login({ username: 'admin', password: 'AdminPassword@123' });
  const d = await api.getDashboard();
  assert.ok(d.totalShops >= 6);
  assert.ok(d.totalSales > 0);
  assert.ok(d.totalCollected > 0);
  assert.ok(d.salespersonsLeaderboard.length >= 3);
});

test('PWA Standalone: CSV report generation exports valid data', async () => {
  const csv = await api.exportCsv({});
  assert.match(csv, /Invoice No,Date,Store Name/);
  assert.match(csv, /Maa Tarini Store/);
});

test('PWA Standalone: Admin can customize and update bill name, logo, and GSTIN properly', async () => {
  // Ensure admin is logged in
  await api.login({ username: 'admin', password: 'AdminPassword@123' });

  const initial = await api.getBillingSettings();
  assert.equal(initial.businessName, 'Amantos Global Industries');
  assert.equal(initial.logoUrl, '/assets/brand/amantos-logo.jpg');

  // Update billing details with custom name and logo
  const customLogoData = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiPjx0ZXh0IHg9IjEwIiB5PSIyNSI+Q1VTVE9NPC90ZXh0Pjwvc3ZnPg==';
  const updated = await api.updateBillingSettings({
    businessName: 'Amantos Global Distribution Hub',
    tagline: 'Direct-to-Retail Fast Logistics',
    phone: '+91 99999 88888',
    address: 'Plot 42, Infocity, Bhubaneswar',
    terms: 'Payment due on delivery or 30-day recurring credit.',
    logoUrl: customLogoData,
    gstin: '21ABCDE1234F1Z5',
  });

  assert.equal(updated.businessName, 'Amantos Global Distribution Hub');
  assert.equal(updated.logoUrl, customLogoData);
  assert.equal(updated.gstin, '21ABCDE1234F1Z5');

  // Verify persistence on fresh fetch
  const persisted = await api.getBillingSettings();
  assert.equal(persisted.businessName, 'Amantos Global Distribution Hub');
  assert.equal(persisted.logoUrl, customLogoData);
  assert.equal(persisted.phone, '+91 99999 88888');
  assert.equal(persisted.gstin, '21ABCDE1234F1Z5');
});

test('PWA Standalone: Retailer onboarding date and billing creation date include valid day and timestamps', async () => {
  const shop = await api.getShopById('shop_1');
  assert.ok(shop.createdAt, 'Shop should have createdAt timestamp');
  const createdDate = new Date(shop.createdAt);
  assert.ok(!isNaN(createdDate.getTime()), 'createdAt should be valid Date');

  const orders = await api.getOrders();
  assert.ok(orders.length > 0, 'Orders should exist');
  const order = orders[0];
  assert.ok(order.date, 'Order should have date');
  const billingDate = new Date(order.date);
  assert.ok(!isNaN(billingDate.getTime()), 'Order billing date should be valid Date');
});

test('PWA Standalone: Admin creates a new staff member and the new staff can log in with their password', async () => {
  // Sign in as Admin
  await api.login({ username: 'admin', password: 'AdminPassword@123' });

  // Onboard new salesperson with custom credentials
  const newRep = await localDb.createSalesperson({
    name: 'Santosh Kumar',
    username: 'sp_santosh',
    phone: '9861234567',
    password: 'Password@Santosh123',
  });
  assert.equal(newRep.username, 'sp_santosh');
  assert.equal(newRep.role, 'SALESPERSON');

  // Verify wrong password fails
  await assert.rejects(
    api.login({ username: 'sp_santosh', password: 'WrongPassword' }),
    /Incorrect password/
  );

  // Verify correct password succeeds and returns SALESPERSON role
  const loginRes = await api.login({ username: 'sp_santosh', password: 'Password@Santosh123' });
  assert.equal(loginRes.user.username, 'sp_santosh');
  assert.equal(loginRes.user.role, 'SALESPERSON');

  // Admin resets password
  await api.login({ username: 'admin', password: 'AdminPassword@123' });
  await localDb.resetPassword(newRep.id, 'NewPass@2026');

  // New staff logs in with reset password
  const resetLogin = await api.login({ username: 'sp_santosh', password: 'NewPass@2026' });
  assert.equal(resetLogin.user.username, 'sp_santosh');
  assert.equal(resetLogin.user.role, 'SALESPERSON');
});

test('PWA Standalone: Admin can delete staff and delete business retailer', async () => {
  // Sign in as Admin
  await api.login({ username: 'admin', password: 'AdminPassword@123' });

  // 1. Create a staff and then delete it
  const tempStaff = await localDb.createSalesperson({
    name: 'Temporary Staff',
    username: 'sp_temp',
    phone: '9861999999',
    password: 'Temp@Password123',
  });
  const staffListBefore = await api.getSalespersons();
  assert.ok(staffListBefore.some((s) => s.id === tempStaff.id));

  await api.deleteSalesperson(tempStaff.id);
  const staffListAfter = await api.getSalespersons();
  assert.ok(!staffListAfter.some((s) => s.id === tempStaff.id));

  // 2. Create a retailer and then delete it
  const tempShop = await api.createShop({
    name: 'Shop To Delete',
    ownerName: 'Delete Owner',
    contactNumber: '9988776655',
    location: 'Plot 99, Cuttack',
  });
  const shopsBefore = await api.getShops({ limit: 100 });
  assert.ok(shopsBefore.data.some((s) => s.id === tempShop.id));

  await api.deleteShop(tempShop.id);
  const shopsAfter = await api.getShops({ limit: 100 });
  assert.ok(!shopsAfter.data.some((s) => s.id === tempShop.id));
});

test('PWA Standalone: Admin can export all retailer data in Excel format', async () => {
  await api.login({ username: 'admin', password: 'AdminPassword@123' });
  const excelXml = await api.exportRetailersExcel();
  assert.match(excelXml, /urn:schemas-microsoft-com:office:spreadsheet/);
  assert.match(excelXml, /Retailer Master Directory/);
  assert.match(excelXml, /Maa Tarini Store/);
  assert.match(excelXml, /Total Billed/);
  assert.match(excelXml, /Outstanding BAKI/);
});




