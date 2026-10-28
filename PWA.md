# F1 16-BITS como PWA

Publique esta pasta em um servidor HTTPS. Para desenvolvimento no mesmo aparelho,
também é possível usar localhost. Abrir index.html diretamente como arquivo não
ativa o service worker. Um endereço HTTP da rede local não permite instalar o
service worker no celular; use HTTPS ao testar em outro aparelho.

No Android, abra o site e use a opção de instalar/adicionar à tela inicial do
navegador. No iPhone, abra no Safari e use Compartilhar → Adicionar à Tela de Início.

Depois que o primeiro carregamento online concluir a instalação do service worker,
o jogo pode abrir offline. As fontes do Google dependem de rede ou do cache do
navegador; sem elas, o jogo usa as fontes alternativas do CSS.

Ao alterar arquivos do jogo, incremente a versão de CACHE_NAME em sw.js.
A nova versão aguarda o fechamento das abas do jogo para entrar em uso, evitando
trocar arquivos durante uma corrida. Os caminhos relativos permitem hospedagem
tanto na raiz quanto em uma subpasta.

Para validar no navegador: verifique Manifest e Service Workers nas ferramentas de
desenvolvedor, aguarde a ativação, recarregue em modo offline e teste a instalação.
