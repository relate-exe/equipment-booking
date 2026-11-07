// Tiny per-key async mutex. It serialises "check overlap then save" for one piece of
// equipment so two simultaneous requests cannot both pass the overlap check.
// (Single server process. For several instances, use a unique index or a transaction.)
const tails = new Map();

module.exports = async function withLock(key, fn) {
  const prev = tails.get(key) || Promise.resolve();
  let release;
  const gate = new Promise((r) => (release = r));
  tails.set(key, prev.then(() => gate));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (tails.get(key) === gate) tails.delete(key);
  }
};
