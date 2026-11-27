import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  const workerUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.origin);
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(workerUrl.href).catch(console.error);
    });
  } else {
    // A previously installed PWA worker must not serve stale development screens.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing]
          .some((worker) => worker?.scriptURL === workerUrl.href)
      ).forEach((registration) => { void registration.unregister(); });
    }).catch(console.error);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
