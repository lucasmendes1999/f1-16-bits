# LM Retro Racing para Android

Aplicativo offline com o jogo HTML/CSS/JavaScript incluído no APK. Não precisa de
servidor, conta, conexão ou permissões de rede. Android 6.0+ (API 23), em paisagem.
Recordes, pintura e campeonato ficam no armazenamento privado do WebView.
Os dados da versão de navegador não são transferidos automaticamente para o app.

## Gerar APK no Windows

Com Android Studio, JDK 17+ e SDK Platform 37 / Build-Tools 36.0.0+ instalados:

```powershell
powershell -ExecutionPolicy Bypass -File .\android\build-apk.ps1
```

Se as ferramentas estiverem em outras pastas:

```powershell
.\android\build-apk.ps1 -SdkPath 'C:\caminho\Android\Sdk' -JavaHome 'D:\Android Studio\jbr'
```

O script usa diretamente AAPT2, javac, D8, zipalign e apksigner do SDK/JDK;
não baixa dependências nem requer Node.js ou Gradle. A saída é
`android/output/lm-retro-racing-debug.apk`. Em cada execução os arquivos atuais da raiz
são copiados para o pacote, sem modificar a versão web. Fontes remotas usam as
alternativas locais do CSS para que o aplicativo funcione desde a primeira abertura offline.

## Instalar e testar

Transfira o APK ao celular e abra-o, permitindo a instalação pelo aplicativo usado
para abrir o arquivo. Ou, com depuração USB ativada e o aparelho autorizado:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r .\android\output\lm-retro-racing-debug.apk
```

Teste controles com dois dedos, áudio, chuva, fantasma, modo avião, voltar do Android,
bloquear/desbloquear a tela e trocar de aplicativo durante corrida e largada.
Ao voltar, a corrida permanece pausada no painel de controle.
Feche e reabra o app para verificar recordes e campeonato. Não desinstale para atualizar:
use o mesmo APK/assinatura com `install -r` para manter os dados. Limpar dados ou
desinstalar remove o progresso.

## APK de lançamento para o APKPure

Para gerar a versão de lançamento:

```powershell
powershell -ExecutionPolicy Bypass -File .\android\build-apk.ps1 -BuildType release
```

Envie **somente** `android/output/lm-retro-racing-1.0.2-release.apk` para análise
no APKPure. Ele tem depuração desativada, certificado próprio, assinatura verificada
e recursos/DEX alinhados. A aprovação da loja é uma etapa separada.

A primeira execução cria `android/.signing/lm-retro-racing-release.jks` e
`android/.signing/release-signing.json`. As próximas execuções reutilizam a mesma
chave; o script interrompe se faltar um desses arquivos. A senha aleatória fica
no JSON e é passada às ferramentas por variável de ambiente, sem aparecer no comando.

**Guarde uma cópia privada da pasta inteira `android/.signing` em outro local seguro.**
Ela contém a chave e a senha para assinar todas as futuras atualizações. Não envie
essa pasta à loja, a terceiros ou ao Git; ela já está no `.gitignore`.

O APK de lançamento usa uma assinatura diferente da versão de testes. Para passar
de `debug` para `release` no mesmo celular, será necessário desinstalar a versão
de testes, apagando os dados locais, e então instalar a release. Não é preciso
desinstalar para atualizar entre futuras versões release assinadas pela mesma chave.
Depois de começar a usar a release, evite instalar os APKs debug por cima dela.

## Android Studio e distribuição

Abra a pasta `android` no Android Studio. O projeto Gradle usa AGP 9.2.0 e
Gradle 9.4.1 (configure essa versão nas opções do Gradle; o wrapper não está incluído).
O Gradle também prepara os assets antes de compilar.

Por padrão, sem `-BuildType release`, o APK gerado é de **desenvolvimento**, com certificado de debug;
serve para testar e compartilhar uma versão inicial. A chave fica em
`android/.tooling/debug.keystore`, ignorada pelo Git. Guarde-a para atualizar
esta instalação sem perder dados. Para publicar na Play Store, gere um Android
App Bundle assinado no Android Studio; o projeto Gradle lê a mesma chave release.

Identificador mantido para atualizar instalações anteriores: `com.lmracing.f116bits`.
Versão: `1.0.2` (código 7). Nome público: **LM Retro Racing**.
O script também salva o APK com nome e tipo de build, como `lm-retro-racing-1.0.2-release.apk`.
Esta versão traz identidade visual própria e pilotos, equipes e patrocinadores fictícios.
Os seis circuitos e suas curvas também usam nomes fictícios: Vale do Sol, Reta Rubi,
Campo dos Ventos, Serra Nebulosa, Jardim das Curvas e Porto Neon.
Campeonatos anteriores mantêm seus pontos e migram os nomes dos adversários.
O logo vetorial está em `icons/brand-mark.svg`; `icons/generate-icons.ps1` gera os PNGs.
O código de versão deve aumentar nas próximas distribuições. Não há anúncios,
analytics, compras ou permissões adicionais nesta versão.

Referências: [conteúdo local no WebView](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content),
[ferramentas de build](https://developer.android.com/build/building-cmdline),
[AGP 9.2](https://developer.android.com/build/releases/agp-9-2-0-release-notes).

A versão 1.0.2 estabiliza o direcional ao deslizar o polegar e amplia os botões de direção.

Na versão 1.0.2, os controles Android usam Touch Events; perda de captura de ponteiro não interrompe o toque. Toque encerrado/cancelado e pausa continuam liberando os comandos.
