/* Maak service worker: only shows follow-up notifications and opens the case when tapped. No caching. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'معاك', {
    body: d.body || 'عندك متابعة النهارده',
    icon: 'icons/maak-192.png', badge: 'icons/maak-badge.png', dir: 'rtl', lang: 'ar',
    data: { url: d.url || 'https://maaksign.com/agent.html' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || 'https://maaksign.com/agent.html';
  if (!/^https:\/\/(www\.)?maaksign\.com\//.test(url)) return;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.includes('/agent') && 'focus' in c) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
