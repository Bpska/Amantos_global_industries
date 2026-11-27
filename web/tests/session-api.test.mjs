import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { AxiosError } from 'axios';
import { api, apiClient } from '../src/services/api.ts';
import { getStoredToken, isUsableToken, subscribeToSessionExpiry, TOKEN_KEY, USER_KEY } from '../src/services/session.ts';

const memory = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
} });
const originalAdapter = apiClient.defaults.adapter;
beforeEach(() => memory.clear());
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });
const tokenFor = (payload) => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify(payload)).toString('base64url'),
  'test-signature',
].join('.');
const profile = { id: 'rep-id', username: 'rep', name: 'Representative', role: 'SALESPERSON', active: true };
const goodToken = () => tokenFor({ userId: profile.id, role: profile.role, exp: Math.floor(Date.now() / 1000) + 3600 });
const respond = (config) => ({ data: { success: true, data: profile }, status: 200, statusText: 'OK', headers: {}, config });
const rejectWith = (status, config) => { throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, { status, data: {} }); };

test('missing, corrupt, old offline, and expired tokens require sign-in', () => {
  for (const token of [null, '', 'undefined', 'pwa_token_user_admin_123', 'bad.token.value',
    tokenFor({ userId: 'admin', role: 'ADMIN' }),
    tokenFor({ userId: 'admin', role: 'ADMIN', exp: 1 }),
    tokenFor({ userId: 'admin', role: 'OTHER', exp: 9999999999 })]) {
    assert.equal(isUsableToken(token), false, String(token));
  }
  assert.equal(isUsableToken(goodToken()), true);
});

test('concurrent session restoration sends one request with the same Bearer token', async () => {
  let calls = 0;
  const token = goodToken();
  memory.set(TOKEN_KEY, token);
  apiClient.defaults.adapter = async (config) => {
    calls++;
    assert.equal(config.url, '/auth/me');
    assert.equal(config.headers.Authorization, `Bearer ${token}`);
    return respond(config);
  };
  const results = await Promise.all([api.me(), api.me()]);
  assert.equal(calls, 1);
  assert.deepEqual(results, [profile, profile]);
  await api.me();
  assert.equal(calls, 2, 'completed profiles are revalidated on the next check');
});

test('a protected request returning 401 clears the session and notifies the UI once', async () => {
  memory.set(TOKEN_KEY, goodToken());
  memory.set(USER_KEY, JSON.stringify(profile));
  let expired = 0;
  const unsubscribe = subscribeToSessionExpiry(() => expired++);
  try {
    apiClient.defaults.adapter = async (config) => rejectWith(401, config);
    await assert.rejects(apiClient.get('/orders'));
    assert.equal(getStoredToken(), null);
    assert.equal(memory.has(USER_KEY), false);
    assert.equal(expired, 1);
  } finally { unsubscribe(); }
});

test('a late 401 from an old request leaves the new login intact', async () => {
  memory.set(TOKEN_KEY, 'new-session');
  apiClient.defaults.adapter = async (config) => rejectWith(401, config);
  await assert.rejects(apiClient.get('/orders', { headers: { Authorization: 'Bearer old-session' } }));
  assert.equal(getStoredToken(), 'new-session');
});

test('server and network failures preserve the token and allow profile retry', async () => {
  const token = goodToken();
  memory.set(TOKEN_KEY, token);
  for (const status of [503, undefined]) {
    apiClient.defaults.adapter = async (config) => {
      if (status) rejectWith(status, config);
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    };
    await assert.rejects(api.me());
    assert.equal(getStoredToken(), token);
    apiClient.defaults.adapter = async (config) => respond(config);
    assert.deepEqual(await api.me(), profile);
  }
});

test('login does not send stale credentials or clear a session for a rejected password', async () => {
  memory.set(TOKEN_KEY, 'existing-session');
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.headers.Authorization, undefined);
    rejectWith(401, config);
  };
  await assert.rejects(api.login({ username: 'rep', password: 'wrong' }));
  assert.equal(getStoredToken(), 'existing-session');
  assert.equal(apiClient.defaults.timeout, 15000);
});
