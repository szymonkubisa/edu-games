/**
 * Registers the offline service worker. These are games for children on
 * tablets, often away from wifi — once visited, they should keep working.
 * Dev keeps serving fresh modules, so registration is production-only.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}
