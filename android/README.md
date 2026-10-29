# F1 16-BITS para Android

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
`android/output/f1-16-bits-debug.apk`. Em cada execução os arquivos atuais da raiz
são copiados para o pacote, sem modificar a versão web. Fontes remotas usam as
alternativas locais do CSS para que o aplicativo funcione desde a primeira abertura offline.

## Instalar e testar

Transfira o APK ao celular e abra-o, permitindo a instalação pelo aplicativo usado
para abrir o arquivo. Ou, com depuração USB ativada e o aparelho autorizado:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r .\android\output\f1-16-bits-debug.apk
```

Teste controles com dois dedos, áudio, chuva, fantasma, modo avião, voltar do Android,
bloquear/desbloquear a tela e trocar de aplicativo durante corrida e largada.
Ao voltar, a corrida permanece pausada no painel de controle.
Feche e reabra o app para verificar recordes e campeonato. Não desinstale para atualizar:
use o mesmo APK/assinatura com `install -r` para manter os dados. Limpar dados ou
desinstalar remove o progresso.

## Android Studio e distribuição

Abra a pasta `android` no Android Studio. O projeto Gradle usa AGP 9.2.0 e
Gradle 9.4.1 (configure essa versão nas opções do Gradle; o wrapper não está incluído).
O Gradle também prepara os assets antes de compilar.

O APK gerado pelo script é de **desenvolvimento**, com certificado de debug;
serve para testar e compartilhar uma versão inicial. A chave fica em
`android/.tooling/debug.keystore`, ignorada pelo Git. Guarde-a para atualizar
esta instalação sem perder dados. Para publicar na Play Store, configure uma
chave de lançamento e gere um Android App Bundle assinado no Android Studio.

Identificador inicial: `com.lmracing.f116bits`. Versão: `0.1.0` (código 1).
O código de versão deve aumentar nas próximas distribuições. Não há anúncios,
analytics, compras ou permissões adicionais nesta versão.

Referências: [conteúdo local no WebView](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content),
[ferramentas de build](https://developer.android.com/build/building-cmdline),
[AGP 9.2](https://developer.android.com/build/releases/agp-9-2-0-release-notes).
