// Installation assistance. Scheduled push notifications still require a backend.
(() => {
  const appleHelp = 'https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios';
  const media = typeof matchMedia === 'function' ? matchMedia('(display-mode: standalone)') : null;
  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);
  const usableAddress = location.protocol === 'https:';
  let installPrompt = null, bannerDismissed = false;
  const installed = () => navigator.standalone === true || !!media?.matches;
  const picture = '<img src="icons/isabela-192.png" alt="" width="48" height="48">';
  const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m-4 4 4-4 4 4M7 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2"/></svg>';

  function instructions() {
    if (isAppleMobile) {
      return `<ol class="install-steps"><li><span>1</span><div><strong>Abra este endereço no Safari</strong><p>${isSafari ? 'Você já está no Safari. Continue pelo menu do navegador.' : 'Abra o Safari e acesse o mesmo endereço deste app.'}</p></div></li><li><span>2</span><div><strong>Toque em Compartilhar ${shareIcon}</strong><p>Dependendo da versão, fica na barra do Safari ou dentro do menu da página.</p></div></li><li><span>3</span><div><strong>Adicionar à Tela de Início</strong><p>Role as opções do compartilhamento. Se não aparecer, vá até Editar Ações e adicione essa opção.</p></div></li><li><span>4</span><div><strong>Ative Abrir como App da Web</strong><p>Se essa opção aparecer, mantenha-a ligada e toque em Adicionar.</p></div></li><li><span>5</span><div><strong>Abra pela tulipa na Tela de Início</strong><p>O ícone Isabela abre o app em sua própria janela. Abrir o link continua levando ao navegador.</p></div></li></ol>`;
    }
    return `<ol class="install-steps"><li><span>1</span><div><strong>Abra o app pelo endereço publicado</strong><p>No Android, use o Chrome. No computador, use Chrome ou Edge.</p></div></li><li><span>2</span><div><strong>Escolha Instalar aplicativo</strong><p>Procure essa opção no menu do navegador ou no ícone de instalação na barra de endereço.</p></div></li><li><span>3</span><div><strong>Abra pelo ícone Isabela</strong><p>Depois de adicionar, você pode acessar seu espaço direto pelo ícone.</p></div></li></ol><p class="install-other">No iPhone, abra pelo Safari e use Compartilhar → Adicionar à Tela de Início. Se aparecer Abrir como App da Web, mantenha ativado.</p>`;
  }

  function showHelp() {
    let dialog = document.getElementById('install-help');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'install-help';
      dialog.className = 'install-dialog';
      dialog.setAttribute('aria-labelledby', 'install-help-title');
      document.body.append(dialog);
      dialog.addEventListener('click', event => {
        if (event.target === dialog) {
          const box = dialog.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
        }
      });
    }
    dialog.innerHTML = `<div class="install-dialog-top"><div class="install-brand">${picture}<div><small>SEU ESPAÇO, SEMPRE POR PERTO</small><h2 id="install-help-title">Instalar o Isabela</h2></div></div><button type="button" class="install-close" aria-label="Fechar instruções">×</button></div>${usableAddress ? '' : '<div class="install-address-note">Para instalar no celular, abra o endereço publicado com HTTPS. O arquivo no computador e o endereço 127.0.0.1 são apenas para visualização local.</div>'}${instructions()}<div class="install-footnote">Os lembretes ainda aguardam conexão com o serviço de envio. A instalação deixa o acesso ao app mais fácil.</div><div class="install-dialog-actions"><a href="${appleHelp}" target="_blank" rel="noopener noreferrer">Ajuda da Apple ↗</a><button class="primary" type="button" data-install-close>Entendi</button></div>`;
    dialog.querySelector('.install-close').onclick = () => dialog.close();
    dialog.querySelector('[data-install-close]').onclick = () => dialog.close();
    if (!dialog.open) dialog.showModal();
  }

  async function requestInstall(button) {
    if (!installPrompt) return showHelp();
    const prompt = installPrompt;
    installPrompt = null;
    button.disabled = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.warn('Não foi possível abrir a instalação:', error);
      showHelp();
    } finally {
      refresh();
      button.disabled = false;
    }
  }

  function addSettingsCard(main) {
    if (!main.querySelector('#notificationform') || main.querySelector('#install-card')) return;
    const section = document.createElement('section');
    section.id = 'install-card';
    section.className = 'card install-card';
    section.setAttribute('aria-labelledby', 'install-card-title');
    section.innerHTML = `<div class="install-brand">${picture}<div><h2 id="install-card-title">Isabela na Tela de Início</h2><p class="muted">Um toque para chegar ao seu espaço.</p></div></div><p class="install-status"></p><div class="install-card-actions"><button type="button" class="primary" data-install-action></button><button type="button" data-install-help>Como instalar</button></div>`;
    main.querySelector('.heading').after(section);
    section.querySelector('[data-install-action]').onclick = event => requestInstall(event.currentTarget);
    section.querySelector('[data-install-help]').onclick = showHelp;
  }

  function updateCard(card) {
    if (!card) return;
    const active = installed(), action = card.querySelector('[data-install-action]');
    card.querySelector('.install-status').textContent = active ? 'Você está usando a versão instalada, aberta pelo ícone do app.' : isAppleMobile ? 'No iPhone, a instalação é feita pelo menu Compartilhar do Safari.' : 'Adicione o app pelo menu de instalação do navegador.';
    action.hidden = active;
    action.textContent = installPrompt ? 'Instalar aplicativo' : isAppleMobile ? 'Ver passos para iPhone' : 'Ver como instalar';
    card.dataset.installed = String(active);
  }

  function refresh() {
    const main = document.querySelector('#app main');
    if (!main) return;
    addSettingsCard(main);
    updateCard(main.querySelector('#install-card'));
    const existing = main.querySelector('#install-banner');
    const showBanner = isAppleMobile && !installed() && !bannerDismissed && !main.querySelector('#install-card');
    if (!showBanner) { existing?.remove(); return; }
    if (existing) return;
    const banner = document.createElement('aside');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.setAttribute('aria-label', 'Instalação no iPhone');
    banner.innerHTML = `${picture}<div><strong>Seu espaço na Tela de Início</strong><button type="button" data-install-help>Veja como instalar no iPhone ${shareIcon}</button></div><button type="button" class="install-dismiss" aria-label="Ocultar dica de instalação">×</button>`;
    banner.querySelector('[data-install-help]').onclick = showHelp;
    banner.querySelector('.install-dismiss').onclick = () => { bannerDismissed = true; banner.remove(); };
    const anchor = main.querySelector('.topline');
    if (anchor) anchor.after(banner); else main.prepend(banner);
  }

  function start() {
    refresh();
    const app = document.getElementById('app');
    // Observe only render replacements, not our own additions inside main.
    if (app) new MutationObserver(refresh).observe(app, { childList: true });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    refresh();
  });
  window.addEventListener('appinstalled', () => { installPrompt = null; bannerDismissed = true; refresh(); });
  media?.addEventListener?.('change', refresh);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const register = () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Instalação offline indisponível:', error));
    if (document.readyState === 'complete') register(); else window.addEventListener('load', register, { once: true });
  }
})();
