// Manual Jest mock: react-native-mmkv wraps a native module with no JS
// implementation to fall back to in a Node test environment, and jest-expo's
// built-in mocks don't cover it (it isn't an Expo-owned package). Backed by a
// module-scope Map keyed by MMKV instance id, mirroring how separate real
// MMKV instances (e.g. "offline-queue" vs "ecotrack.query-cache") don't share
// storage with each other.
const stores = new Map();

function storeFor(id) {
  if (!stores.has(id)) stores.set(id, new Map());
  return stores.get(id);
}

function createMMKV(configuration = {}) {
  const store = storeFor(configuration.id ?? 'mock-default');
  return {
    id: configuration.id ?? 'mock-default',
    get length() {
      return store.size;
    },
    set(key, value) {
      store.set(key, value);
    },
    getString(key) {
      const value = store.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getNumber(key) {
      const value = store.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getBoolean(key) {
      const value = store.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    contains(key) {
      return store.has(key);
    },
    remove(key) {
      return store.delete(key);
    },
    getAllKeys() {
      return Array.from(store.keys());
    },
    clearAll() {
      store.clear();
    },
  };
}

module.exports = { createMMKV };
