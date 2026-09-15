/**
 * ذاكرة مؤقتة بسيطة في الذاكرة مع انتهاء صلاحية وسقف حجم.
 * تكفي لخادم واحد (كما محدّدات المعدّل)؛ عند التوسّع أفقياً تُستبدل بـ Redis.
 */
export const createTtlCache = ({ ttlMs, maxEntries = 1000 }) => {
  const store = new Map();

  const get = (key) => {
    const hit = store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    return hit.value;
  };

  const set = (key, value) => {
    // أبسط سياسة إخلاء: الأقدم إدراجاً يخرج أولاً
    if (store.size >= maxEntries) {
      store.delete(store.keys().next().value);
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  const del = (key) => store.delete(key);

  return { get, set, del };
};
