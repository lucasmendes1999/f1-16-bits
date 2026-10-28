const installPanel = document.getElementById('installPanel');
const installButton = document.getElementById('installBtn');
const installHelp = document.getElementById('installHelp');
const standalone = window.matchMedia('(display-mode: standalone)');
let installPrompt = null;
let installed = standalone.matches || navigator.standalone === true;
const showInstallMessage = message => {
  installHelp.textContent = message;
  installHelp.hidden = false;
};

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
  showInstallMessage('Jogo instalado! Abra pelo ícone na tela inicial.');
  updateInstallPanel();
});

const onDisplayModeChange = event => {
  installed = event.matches || navigator.standalone === true;
  updateInstallPanel();
};
if (standalone.addEventListener) {
  standalone.addEventListener('change', onDisplayModeChange);
} else if (standalone.addListener) {
  standalone.addListener(onDisplayModeChange);
}

installButton.addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    installButton.disabled = true;
    try {
      const result = await prompt.prompt();
      const choice = result || await prompt.userChoice;
      showInstallMessage(choice && choice.outcome === 'accepted'
        ? 'Pedido enviado ao navegador. Aguarde a instalação e confira o ícone na tela inicial. Se o navegador mostrar um erro, informe a mensagem exibida.'
        : 'Instalação cancelada. Para tentar de novo, use o menu do navegador → Instalar aplicativo.');
    } catch (error) {
      showInstallMessage(`Não foi possível abrir a instalação (${error.name || 'Erro'}: ${error.message || 'sem detalhes'}). Tente pelo menu do navegador → Instalar aplicativo e informe a mensagem se falhar.`);
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
  let hadController = Boolean(navigator.serviceWorker.controller);
  let updateReady = false;
  let reloading = false;
  const reloadAtMenu = () => {
    const title = document.getElementById('titleScreen');
    if (updateReady && !reloading && title && getComputedStyle(title).display !== 'none') {
      reloading = true;
      window.location.reload();
    }
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First-time offline setup does not require a reload.
    if (hadController) updateReady = true;
    hadController = true;
    reloadAtMenu();
  });
  const title = document.getElementById('titleScreen');
  if (title) new MutationObserver(reloadAtMenu).observe(title, { attributes: true, attributeFilter: ['style', 'class'] });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(registration => {
      let lastCheck = Date.now();
      const checkForUpdate = () => {
        if (document.hidden || Date.now() - lastCheck < 60000) return;
        lastCheck = Date.now();
        registration.update().catch(error => console.debug('Verificação de atualização adiada:', error));
      };
      window.addEventListener('focus', checkForUpdate);
      document.addEventListener('visibilitychange', checkForUpdate);
    }).catch(error => {
      showInstallMessage(`Não foi possível preparar o modo offline (${error.name || 'Erro'}: ${error.message || 'sem detalhes'}). Verifique a conexão e recarregue o jogo.`);
      console.error('Não foi possível ativar o modo offline:', error);
    });
  });
}
