// Manual Jest mock: expo-crypto's randomUUID() is backed by a native module
// that Jest's test environment has nothing to call into, and jest-expo's
// default mocking leaves it returning undefined rather than throwing —
// which silently corrupts anything keyed by the "unique" id it hands back.
// Node's own crypto module already provides a real RFC 4122 UUID generator,
// so there's no need to fake one.
const nodeCrypto = require('crypto');

module.exports = {
  randomUUID: () => nodeCrypto.randomUUID(),
};
