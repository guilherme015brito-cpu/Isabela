// Installation and offline shell only. Push subscriptions require a backend.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Instalação offline indisponível:', error));
  });
}
