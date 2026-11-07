import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { AxiosError } from 'axios';
import { api, apiClient, getApiErrorMessage } from '../src/services/api.ts';

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: () => null },
});

const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

function respondWith(data, inspect = () => {}) {
  apiClient.defaults.adapter = async (config) => {
    inspect(config);
    return { data: { success: true, data }, status: 200, statusText: 'OK', headers: {}, config };
  };
}

test('creation sends the fullName field required by the API', async () => {
  respondWith({ id: 'new-salesperson' }, (config) => {
    assert.equal(config.url, '/admin/salespersons');
    assert.equal(config.method, 'post');
    assert.deepEqual(JSON.parse(config.data), {
      fullName: 'Test Representative', username: 'sp_test', phone: '9876543210', password: 'Test@123',
    });
  });
  const result = await api.createSalesperson({
    name: 'Test Representative', username: 'sp_test', phone: '9876543210', password: 'Test@123',
  });
  assert.equal(result.id, 'new-salesperson');
});

test('profile and status updates send canonical API fields, including false', async () => {
  respondWith({}, (config) => {
    assert.deepEqual(JSON.parse(config.data), { fullName: 'Updated Name', isActive: false });
  });
  await api.updateSalesperson('rep-id', { name: 'Updated Name', active: false });
});

test('the roster accepts canonical API names and inactive status', async () => {
  respondWith([{ id: 'rep-id', fullName: 'Test Representative', isActive: false }]);
  const [rep] = await api.getSalespersons();
  assert.equal(rep.name, 'Test Representative');
  assert.equal(rep.active, false);
});

function apiError(status, data) {
  return new AxiosError('Request failed', undefined, undefined, undefined, { status, data });
}

test('validation errors show field details instead of a generic failure', () => {
  const error = apiError(400, {
    message: 'Validation failed',
    error: [{ field: 'username', message: 'Username must be at least 3 characters' }],
  });
  assert.equal(getApiErrorMessage(error, 'Save failed'), 'Username must be at least 3 characters');
});

test('duplicate usernames preserve the server explanation', () => {
  const error = apiError(400, { message: "Username 'sp_test' is already taken" });
  assert.equal(getApiErrorMessage(error, 'Save failed'), "Username 'sp_test' is already taken");
});

test('a stopped API and empty proxy failures explain how to recover', () => {
  for (const error of [new AxiosError('Network Error'), apiError(500, ''), apiError(502, '<html>Bad Gateway</html>')]) {
    assert.match(getApiErrorMessage(error, 'Save failed'), /backend API is running/);
  }
});
