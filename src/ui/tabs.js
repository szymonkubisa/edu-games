/**
 * Turns a row of buttons into a real ARIA tablist: arrow-key navigation,
 * roving tabindex and `aria-selected` that screen readers can announce.
 * Previously these were plain buttons with a `.on` class and nothing else.
 */
export function createTabs(list, { onChange } = {}) {
  const tabs = [...list.querySelectorAll('button')];
  list.setAttribute('role', 'tablist');

  tabs.forEach(tab => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('type', 'button');
    const panelId = tab.dataset.panel;
    if (panelId) {
      tab.setAttribute('aria-controls', panelId);
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        if (!panel.id) panel.id = panelId;
        if (tab.id) panel.setAttribute('aria-labelledby', tab.id);
      }
    }
    tab.addEventListener('click', () => select(tab.dataset.tab));
    tab.addEventListener('keydown', e => {
      const dir = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' }[e.key];
      if (dir === undefined) return;
      e.preventDefault();
      const i = tabs.indexOf(tab);
      const next =
        dir === 'first' ? tabs[0]
        : dir === 'last' ? tabs.at(-1)
        : tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      select(next.dataset.tab);
    });
  });

  function select(id, { silent = false } = {}) {
    let selected = null;
    for (const tab of tabs) {
      const on = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('on', on);
      const panel = tab.dataset.panel && document.getElementById(tab.dataset.panel);
      if (panel) panel.classList.toggle('hidden', !on);
      if (on) selected = tab;
    }
    if (selected && !silent && onChange) onChange(id);
    return selected;
  }

  return {
    select,
    get current() {
      return tabs.find(t => t.getAttribute('aria-selected') === 'true')?.dataset.tab ?? null;
    },
    tabs
  };
}
