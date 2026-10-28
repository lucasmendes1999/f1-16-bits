const installPanel = document.getElementById('installPanel');
const installButton = document.getElementById('installBtn');
const installHelp = document.getElementById('installHelp');
const standalone = window.matchMedia('(display-mode: standalone)');
let installPrompt = null;
let installed = standalone.matches || navigator.standalone === true;

const updateInstallPanel = () => {
  installPanel.hidden = installed;
  installButton.textContent = installPrompt ? 'INSTALAR JOGO' : 'COMO INSTALAR NO CELULAR';
};

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installHelp.hidden = true;
  updateInstallPanel();
});

window.addEventListener('appinstalled', () => {
  installed = true;
  installPrompt = null;
  updateInstallPanel();
});

standalone.addEventListener('change', event => {
  installed = event.matches || navigator.standalone === true;
  updateInstallPanel();
});

installButton.addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    installButton.disabled = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      installHelp.textContent = 'Abra o menu do navegador e procure Instalar aplicativo ou Adicionar à tela inicial.';
      installHelp.hidden = false;
      console.error('Não foi possível abrir a instalação:', error);
    } finally {
      installButton.disabled = false;
      updateInstallPanel();
    }
    return;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!window.isSecureContext || location.protocol === 'file:') {
    installHelp.textContent = 'Abra o jogo pelo endereço HTTPS publicado para instalar no celular.';
  } else if (isIOS) {
    installHelp.textContent = 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Se estiver em outro aplicativo, abra este link no Safari.';
  } else {
    installHelp.textContent = 'No Chrome, abra o menu ⋮ e procure Instalar aplicativo ou Adicionar à tela inicial. Se abriu pelo WhatsApp ou Instagram, abra este link no Chrome.';
  }
  installHelp.hidden = false;
});

updateInstallPanel();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.error('Não foi possível ativar o modo offline:', error);
    });
  });
}
