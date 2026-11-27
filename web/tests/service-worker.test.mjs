import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker(overrides = {}) {
  const events = {};
  vm.runInNewContext(source, {
    URL,
    self: {
      location: { origin: 'http://localhost:5173' },
      addEventListener: (name, handler) => { events[name] = handler; },
      clients: { claim: () => {} },
    },
    ...overrides,
  });
  return events;
}

test('the service worker never intercepts API or authenticated requests', () => {
  const events = worker();
  for (const [url, authenticated] of [
    ['http://localhost:5173/api/v1/auth/me', false],
    ['http://localhost:5173/api/v1/admin/dashboard', false],
    ['http://localhost:5173/private-file', true],
    ['https://other.example/asset', false],
  ]) {
    events.fetch({
      request: { url, method: 'GET', headers: { has: () => authenticated } },
      respondWith: () => assert.fail(`Unexpected cached response for ${url}`),
    });
  }
});

test('navigation loads the current app shell while online', async () => {
  let response;
  const fresh = { body: 'current app shell' };
  const events = worker({
    fetch: async () => fresh,
    caches: { match: () => assert.fail('Online navigation must not use a stale screen') },
  });
  events.fetch({
    request: { url: 'http://localhost:5173/admin', method: 'GET', mode: 'navigate', headers: { has: () => false } },
    respondWith: (result) => { response = result; },
  });
  assert.equal(await response, fresh);
});

test('navigation can show the cached shell when offline', async () => {
  let response;
  const cached = { body: 'offline shell' };
  const events = worker({
    fetch: async () => { throw new Error('Offline'); },
    caches: { match: async (path) => { assert.equal(path, '/'); return cached; } },
  });
  events.fetch({
    request: { url: 'http://localhost:5173/admin', method: 'GET', mode: 'navigate', headers: { has: () => false } },
    respondWith: (result) => { response = result; },
  });
  assert.equal(await response, cached);
});

test('activation removes old HeyLane caches while preserving other applications', async () => {
  let complete;
  const deleted = [];
  const events = worker({
    caches: {
      keys: async () => ['heylane-pwa-v3-role-panels', 'heylane-pwa-v4-api-sessions', 'other-app'],
      delete: async (key) => { deleted.push(key); },
    },
  });
  events.activate({ waitUntil: (promise) => { complete = promise; } });
  await complete;
  assert.deepEqual(deleted, ['heylane-pwa-v3-role-panels']);
});
