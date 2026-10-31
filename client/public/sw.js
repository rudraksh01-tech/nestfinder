// Service worker: runs in the background so lead alerts show even when NestFinder is closed.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'NestFinder', {
      body: data.body || 'You have a new lead.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag, // same tag replaces an older notification instead of stacking
      data: { url: data.url || '/broker' },
    }),
  )
})

// Clicking the notification focuses an open NestFinder tab, or opens one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/broker', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((tabs) => {
      const tab = tabs.find((t) => t.url.startsWith(self.location.origin))
      if (tab) return tab.navigate(url).then((t) => (t ?? tab).focus())
      return self.clients.openWindow(url)
    }),
  )
})
