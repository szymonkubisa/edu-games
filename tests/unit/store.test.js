import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, memoryStorage, BADGES, SCHEMA_VERSION } from '../../src/core/store.js';

const KEY = 'eduGames.v2';
const LEGACY = 'eduGames.v1';

describe('store: settings', () => {
  let io, store;
  beforeEach(() => {
    io = memoryStorage();
    store = createStore(io);
  });

  it('returns the default for an unset key', () => {
    expect(store.get('lang', 'pl')).toBe('pl');
  });

  it('round-trips a value through storage', () => {
    store.set('lang', 'en');
    expect(store.get('lang', 'pl')).toBe('en');
    expect(createStore(io).get('lang', 'pl')).toBe('en');
  });

  it('keeps a falsy value rather than falling back to the default', () => {
    store.set('sound', false);
    expect(store.get('sound', true)).toBe(false);
  });
});

describe('store: stars and badges', () => {
  let store;
  beforeEach(() => {
    store = createStore(memoryStorage());
  });

  it('counts stars per game and in total', () => {
    store.addStar('math');
    store.addStar('math');
    store.addStar('reading');
    expect(store.stars('math')).toBe(2);
    expect(store.stars('reading')).toBe(1);
    expect(store.totalStars()).toBe(3);
  });

  it('awards the first badge on the first star, once', () => {
    expect(store.addStar('math').newBadges.map(b => b.id)).toEqual(['seed']);
    expect(store.addStar('math').newBadges).toEqual([]);
    expect(store.hasBadge('seed')).toBe(true);
  });

  it('awards each threshold badge exactly as the total crosses it', () => {
    const seen = [];
    for (let i = 0; i < 100; i++) {
      for (const badge of store.addStar('math').newBadges) seen.push([badge.id, i + 1]);
    }
    expect(seen).toEqual(BADGES.map(b => [b.id, b.need]));
  });

  it('counts badges against the combined total, not one game', () => {
    for (let i = 0; i < 5; i++) store.addStar('math');
    const fresh = [];
    for (let i = 0; i < 5; i++) fresh.push(...store.addStar('reading').newBadges);
    expect(fresh.map(b => b.id)).toEqual(['ten']);
  });
});

describe('store: practice is a separate currency', () => {
  it('does not feed the star total or badges', () => {
    const store = createStore(memoryStorage());
    for (let i = 0; i < 50; i++) store.addPractice('reading');
    expect(store.practice('reading')).toBe(50);
    expect(store.totalStars()).toBe(0);
    expect(store.badges()).toEqual([]);
  });
});

describe('store: reset', () => {
  it('clears progress but keeps settings', () => {
    const store = createStore(memoryStorage());
    store.set('lang', 'en');
    store.addStar('math');
    store.addPractice('reading');
    store.recordFact('mul:3x4', false);
    store.reset();
    expect(store.totalStars()).toBe(0);
    expect(store.practice('reading')).toBe(0);
    expect(store.badges()).toEqual([]);
    expect(store.factStats('mul:3x4')).toEqual({ seen: 0, wrong: 0 });
    expect(store.get('lang', 'pl')).toBe('en');
  });
});

describe('store: fact history', () => {
  it('records attempts and mistakes', () => {
    const store = createStore(memoryStorage());
    store.recordFact('mul:3x4', false);
    store.recordFact('mul:3x4', true);
    expect(store.factStats('mul:3x4')).toEqual({ seen: 2, wrong: 1 });
  });

  it('reports an untouched fact as unseen', () => {
    expect(createStore(memoryStorage()).factStats('mul:9x9')).toEqual({ seen: 0, wrong: 0 });
  });
});

describe('store: hostile storage', () => {
  it('starts clean when the payload is corrupt instead of throwing', () => {
    const io = memoryStorage();
    io.setItem(KEY, '{not json');
    const store = createStore(io);
    expect(store.totalStars()).toBe(0);
    expect(() => store.addStar('math')).not.toThrow();
  });

  it('repairs a partial payload rather than producing NaN', () => {
    const io = memoryStorage();
    io.setItem(KEY, JSON.stringify({ stars: { math: 'lots' }, badges: 'nope' }));
    const store = createStore(io);
    expect(store.stars('math')).toBe(0);
    expect(store.badges()).toEqual([]);
  });

  it('drops badge ids it does not recognise', () => {
    const io = memoryStorage();
    io.setItem(KEY, JSON.stringify({ badges: ['seed', 'hacked'] }));
    expect(createStore(io).hasBadge('hacked')).toBe(false);
  });

  it('keeps playing when writes are rejected (private mode, quota)', () => {
    const readOnly = {
      ...memoryStorage(),
      setItem() {
        throw new Error('QuotaExceededError');
      }
    };
    const store = createStore(readOnly);
    expect(() => store.addStar('math')).not.toThrow();
    expect(store.stars('math')).toBe(1); // in memory for this session
  });
});

describe('store: migration from v1', () => {
  it('carries stars, badges and settings over from the old key', () => {
    const io = memoryStorage();
    io.setItem(
      LEGACY,
      JSON.stringify({ settings: { lang: 'en' }, stars: { math: 12, reading: 3 }, badges: ['seed', 'ten'] })
    );
    const store = createStore(io);
    expect(store.stars('math')).toBe(12);
    expect(store.totalStars()).toBe(15);
    expect(store.badges().sort()).toEqual(['seed', 'ten']);
    expect(store.get('lang', 'pl')).toBe('en');
    expect(JSON.parse(io.getItem(KEY)).v).toBe(SCHEMA_VERSION);
  });

  it('gives a migrated profile the new counters at zero', () => {
    const io = memoryStorage();
    io.setItem(LEGACY, JSON.stringify({ stars: { math: 4, reading: 0 } }));
    const store = createStore(io);
    expect(store.practice('reading')).toBe(0);
    expect(store.factStats('mul:2x2')).toEqual({ seen: 0, wrong: 0 });
  });

  it('prefers current data over legacy data when both exist', () => {
    const io = memoryStorage();
    io.setItem(LEGACY, JSON.stringify({ stars: { math: 99, reading: 0 } }));
    io.setItem(KEY, JSON.stringify({ v: 2, stars: { math: 1, reading: 0 } }));
    expect(createStore(io).stars('math')).toBe(1);
  });
});

describe('store: subscribers', () => {
  it('notifies on change and stops after unsubscribe', () => {
    const store = createStore(memoryStorage());
    const seen = [];
    const off = store.subscribe(s => seen.push(s.totalStars));
    store.addStar('math');
    store.addStar('math');
    off();
    store.addStar('math');
    expect(seen).toEqual([1, 2]);
  });
});
