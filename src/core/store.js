/**
 * Persistent progress: settings, stars, badges and per-fact practice history.
 *
 * Two separate currencies, deliberately:
 *   stars    — earned by answering something the app can actually check.
 *   practice — earned by self-graded modes ("I read it out loud!"), where the
 *              child grades themselves. Badges key off stars only, so tapping
 *              through the reading cards cannot mint a crown.
 */

export const SCHEMA_VERSION = 2;
const KEY = 'eduGames.v2';
const LEGACY_KEY = 'eduGames.v1';

/** Badge thresholds, measured against verified stars. */
export const BADGES = [
  { id: 'seed', need: 1, em: '🌱', pl: 'Pierwsza gwiazdka', en: 'First star' },
  { id: 'ten', need: 10, em: '⭐', pl: '10 gwiazdek', en: '10 stars' },
  { id: 'star25', need: 25, em: '🌟', pl: '25 gwiazdek', en: '25 stars' },
  { id: 'cup', need: 50, em: '🏆', pl: '50 gwiazdek', en: '50 stars' },
  { id: 'crown', need: 100, em: '👑', pl: '100 gwiazdek', en: '100 stars' }
];

function blank() {
  return {
    v: SCHEMA_VERSION,
    settings: {},
    stars: { math: 0, reading: 0 },
    practice: { math: 0, reading: 0 },
    badges: [],
    facts: {}
  };
}

/** Fill in anything a hand-edited or partial payload is missing. */
function normalise(raw) {
  const d = blank();
  if (!raw || typeof raw !== 'object') return d;
  if (raw.settings && typeof raw.settings === 'object') d.settings = { ...raw.settings };
  if (raw.stars && typeof raw.stars === 'object') {
    for (const k of Object.keys(d.stars)) d.stars[k] = num(raw.stars[k]);
  }
  if (raw.practice && typeof raw.practice === 'object') {
    for (const k of Object.keys(d.practice)) d.practice[k] = num(raw.practice[k]);
  }
  if (Array.isArray(raw.badges)) d.badges = raw.badges.filter(id => BADGES.some(b => b.id === id));
  if (raw.facts && typeof raw.facts === 'object') {
    for (const [id, s] of Object.entries(raw.facts)) {
      d.facts[id] = { seen: num(s && s.seen), wrong: num(s && s.wrong) };
    }
  }
  return d;
}

const num = n => (Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);

/**
 * @param {Storage} [storage] injectable for tests; falls back to a memory shim
 *   when localStorage is unavailable (Safari private mode, blocked site data).
 */
export function createStore(storage) {
  const io = resolveStorage(storage);
  const listeners = new Set();
  let data = read();

  function read() {
    const current = parse(io.getItem(KEY));
    if (current) return normalise(current);
    const legacy = parse(io.getItem(LEGACY_KEY));
    if (legacy) {
      // v1 had no practice counter and no fact history; the rest carries over.
      const migrated = normalise(legacy);
      write(migrated);
      return migrated;
    }
    return blank();
  }

  function parse(text) {
    if (!text) return null;
    try {
      const v = JSON.parse(text);
      return v && typeof v === 'object' ? v : null;
    } catch {
      return null; // corrupt payload: start clean rather than crash the page
    }
  }

  function write(value) {
    try {
      io.setItem(KEY, JSON.stringify(value));
      return true;
    } catch {
      return false; // quota or private mode: keep playing, just don't persist
    }
  }

  function save() {
    write(data);
    emit();
  }

  function emit() {
    for (const fn of listeners) fn(snapshot());
  }

  function snapshot() {
    return {
      stars: { ...data.stars },
      practice: { ...data.practice },
      badges: data.badges.slice(),
      totalStars: total()
    };
  }

  const total = () => Object.values(data.stars).reduce((a, b) => a + b, 0);

  /** Award any badge whose threshold the current star total has crossed. */
  function syncBadges() {
    const t = total();
    const fresh = BADGES.filter(b => t >= b.need && !data.badges.includes(b.id));
    for (const b of fresh) data.badges.push(b.id);
    return fresh;
  }

  // Another tab wrote to the same key: adopt its state instead of clobbering it.
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', e => {
      if (e.key !== KEY) return;
      data = normalise(parse(e.newValue));
      emit();
    });
  }

  return {
    BADGES,

    /** Re-read from storage. Call on `pageshow` so a bfcache restore is current. */
    refresh() {
      data = read();
      emit();
      return snapshot();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    snapshot,

    get(key, def) {
      return key in data.settings ? data.settings[key] : def;
    },
    set(key, val) {
      data.settings[key] = val;
      save();
    },

    stars(game) {
      return num(data.stars[game]);
    },
    totalStars: total,
    addStar(game) {
      data.stars[game] = num(data.stars[game]) + 1;
      const newBadges = syncBadges();
      save();
      return { count: data.stars[game], total: total(), newBadges };
    },

    practice(game) {
      return num(data.practice[game]);
    },
    addPractice(game) {
      data.practice[game] = num(data.practice[game]) + 1;
      save();
      return { count: data.practice[game] };
    },

    badges() {
      const fresh = syncBadges();
      if (fresh.length) save();
      return data.badges.slice();
    },
    hasBadge(id) {
      return data.badges.includes(id);
    },

    /**
     * Remember how a single fact ("mul:3x4") went, so the sampler can favour
     * the ones the child has not met or keeps missing.
     */
    recordFact(id, correct) {
      const s = data.facts[id] || (data.facts[id] = { seen: 0, wrong: 0 });
      s.seen++;
      if (!correct) s.wrong++;
      save();
      return { ...s };
    },
    factStats(id) {
      return { ...(data.facts[id] || { seen: 0, wrong: 0 }) };
    },

    /** Clears progress but keeps settings (language, sound, theme). */
    reset() {
      data.stars = { math: 0, reading: 0 };
      data.practice = { math: 0, reading: 0 };
      data.badges = [];
      data.facts = {};
      save();
    }
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    const probe = '__edu__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return memoryStorage();
  }
}

export function memoryStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k)
  };
}

export const store = createStore();
export default store;
