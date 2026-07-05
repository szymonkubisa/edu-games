/* ============================================================
   EduStore — wspólny magazyn ustawień i osiągnięć (localStorage)
   Współdzielony przez: index.html, matematyka-na-wesolo.html,
   czytanie-na-wesolo.html
   ============================================================ */
window.EduStore = (function () {
  const KEY = 'eduGames.v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { /* prywatny tryb / brak miejsca — działamy dalej bez zapisu */ }
  }

  const data = load();
  data.settings = data.settings || {};
  data.stars = data.stars || { math: 0, reading: 0 };
  data.badges = data.badges || [];

  /* Odznaki liczone na podstawie łącznej liczby gwiazdek. */
  const BADGES = [
    { id: 'seed',   need: 1,   em: '🌱', pl: 'Pierwsza gwiazdka', en: 'First star' },
    { id: 'ten',    need: 10,  em: '⭐', pl: '10 gwiazdek',        en: '10 stars' },
    { id: 'star25', need: 25,  em: '🌟', pl: '25 gwiazdek',        en: '25 stars' },
    { id: 'cup',    need: 50,  em: '🏆', pl: '50 gwiazdek',        en: '50 stars' },
    { id: 'crown',  need: 100, em: '👑', pl: '100 gwiazdek',       en: '100 stars' }
  ];

  function total() {
    return (data.stars.math || 0) + (data.stars.reading || 0);
  }

  /* Uaktualnia listę zdobytych odznak. Zwraca tablicę NOWO zdobytych. */
  function syncBadges() {
    const t = total();
    const fresh = [];
    BADGES.forEach(b => {
      if (t >= b.need && !data.badges.includes(b.id)) {
        data.badges.push(b.id);
        fresh.push(b);
      }
    });
    if (fresh.length) save();
    return fresh;
  }

  return {
    BADGES,

    /* ---- ustawienia ---- */
    get(key, def) {
      return (key in data.settings) ? data.settings[key] : def;
    },
    set(key, val) {
      data.settings[key] = val;
      save();
    },

    /* ---- gwiazdki / osiągnięcia ---- */
    stars(game) { return data.stars[game] || 0; },
    totalStars: total,
    addStar(game) {
      data.stars[game] = (data.stars[game] || 0) + 1;
      save();
      const fresh = syncBadges();
      return { count: data.stars[game], newBadges: fresh };
    },

    /* ---- odznaki ---- */
    badges() {
      syncBadges();
      return data.badges.slice();
    },
    hasBadge(id) { return data.badges.includes(id); },

    /* ---- reset postępów (zachowuje ustawienia) ---- */
    reset() {
      data.stars = { math: 0, reading: 0 };
      data.badges = [];
      save();
    }
  };
})();
