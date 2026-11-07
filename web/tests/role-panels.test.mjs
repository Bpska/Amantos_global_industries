import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { localDb } from '../src/services/localDatabase.ts';
import { panelHome, canAccessPanel } from '../src/services/access.ts';

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

beforeEach(async () => {
  memory.clear();
  await localDb.login({ username: 'admin', password: 'AdminPassword@123' });
});

test('admin and staff have different home panels and cannot enter each other panel', () => {
  assert.equal(panelHome('ADMIN'), '/admin');
  assert.equal(panelHome('SALESPERSON'), '/staff');
  assert.equal(canAccessPanel('ADMIN', 'ADMIN'), true);
  assert.equal(canAccessPanel('SALESPERSON', 'SALESPERSON'), true);
  assert.equal(canAccessPanel('ADMIN', 'SALESPERSON'), false);
  assert.equal(canAccessPanel('SALESPERSON', 'ADMIN'), false);
});

test('staff session restores the staff roster identity instead of defaulting to admin', async () => {
  const { user } = await localDb.login({ username: 'sp_rajesh', password: 'Sales@123Rajesh' });
  assert.equal((await localDb.me()).id, user.id);
  storage.setItem('retailflow_admin_user', JSON.stringify({ ...user, role: 'ADMIN' }));
  assert.equal((await localDb.me()).role, 'SALESPERSON');
});

test('staff lists and dashboard contain only their assigned work, even with another rep filter', async () => {
  const all = await localDb.getShops({ limit: 100 });
  const allOrders = await localDb.getOrders();
  const { user } = await localDb.login({ username: 'sp_rajesh' });
  const expected = all.data.filter((shop) => shop.salespersonId === user.id);
  assert.ok(expected.length > 0 && expected.length < all.total);
  const result = await localDb.getShops({ limit: 100 });
  assert.deepEqual(result.data.map((shop) => shop.id), expected.map((shop) => shop.id));
  assert.equal((await localDb.getShops({ salespersonId: 'user_amit' })).total, 0);
  const orders = await localDb.getOrders();
  assert.ok(orders.length > 0);
  assert.ok(orders.every((order) => order.salespersonId === user.id));
  const dashboard = await localDb.getDashboard();
  assert.equal(dashboard.totalShops, expected.length);
  assert.equal(dashboard.totalSales, allOrders.filter((o) => o.salespersonId === user.id).reduce((sum, o) => sum + o.totalAmount, 0));
  assert.ok(dashboard.salespersonsLeaderboard.every((rep) => rep.id === user.id));
  assert.ok(dashboard.topBakiShops.every((shop) => shop.salespersonId === user.id));
});

test('staff cannot open, order for, or collect payments from another representative retailer', async () => {
  const shops = (await localDb.getShops({ limit: 100 })).data;
  const foreign = shops.find((shop) => shop.salespersonId !== 'user_rajesh');
  const order = (await localDb.getShopById(foreign.id)).orders.find((order) => order.baki > 0);
  assert.ok(order);
  await localDb.login({ username: 'sp_rajesh' });
  await assert.rejects(localDb.getShopById(foreign.id), /not assigned/);
  await assert.rejects(localDb.addOrder(foreign.id, { product: 'Test', quantity: 1, unitPrice: 100 }), /not assigned/);
  await assert.rejects(localDb.payOrder(order.id, 1), /not assigned/);
});

test('staff onboarding assigns the logged-in rep and persists orders and collections', async () => {
  const { user } = await localDb.login({ username: 'sp_amit' });
  const shop = await localDb.createShop({
    name: 'Staff Test Store', ownerName: 'Owner', contactNumber: '9988776655', location: 'Bhubaneswar',
    salespersonId: 'user_rajesh', openingOrderProduct: 'Test SKU', openingOrderQuantity: 5,
    openingOrderPrice: 100, initialPaidAmount: 200,
  });
  assert.equal(shop.salespersonId, user.id);
  assert.equal(shop.totalAmount, 500);
  assert.equal(shop.paidAmount, 200);
  const { order } = await localDb.payOrder(shop.orders[0].id, 100);
  assert.equal(order.baki, 200);
  await assert.rejects(localDb.payOrder(order.id, -100), /greater than zero/);
  await assert.rejects(localDb.payOrder(order.id, 201), /no more than/);
  await localDb.login({ username: 'admin' });
  const restored = await localDb.getShopById(shop.id);
  assert.equal(restored.salespersonId, user.id);
  assert.equal(restored.baki, 200);
});

test('staff cannot change team members, products, or business billing settings', async () => {
  await localDb.login({ username: 'sp_rajesh' });
  const operations = [
    () => localDb.createSalesperson({ name: 'Rep', username: 'test_rep', phone: '9988776655' }),
    () => localDb.updateSalesperson('user_amit', { active: false }),
    () => localDb.resetPassword('user_amit', 'new-password'),
    () => localDb.addProduct({ name: 'Unauthorized' }),
    () => localDb.updateProduct('prod_1', { unitPrice: 1 }),
    () => localDb.deleteProduct('prod_1'),
    () => localDb.updateBillingSettings({ businessName: 'Unauthorized' }),
  ];
  for (const operation of operations) await assert.rejects(operation(), /Only administrators/);
});

test('missing or corrupt sessions and deactivated accounts never fall back to admin', async () => {
  storage.removeItem('retailflow_admin_user');
  await assert.rejects(localDb.me(), /sign in/);
  storage.setItem('retailflow_admin_user', '{broken');
  await assert.rejects(localDb.me(), /sign in/);
  await localDb.login({ username: 'admin' });
  await localDb.updateSalesperson('user_amit', { active: false });
  await assert.rejects(localDb.login({ username: 'sp_amit' }), /deactivated/);
});
