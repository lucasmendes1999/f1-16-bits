param(
    [string]$SdkPath = $env:ANDROID_HOME,
    [string]$JavaHome = $env:JAVA_HOME
)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$gameRoot = Split-Path $projectRoot -Parent

if (-not $SdkPath) { $SdkPath = $env:ANDROID_SDK_ROOT }
if (-not $SdkPath) { $SdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not $JavaHome) {
    $jdkCandidates = @('D:\Android Studio\jbr', 'C:\Program Files\Android\Android Studio\jbr')
    $JavaHome = $jdkCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'bin\javac.exe') } | Select-Object -First 1
}
if (-not $JavaHome -or -not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin\javac.exe'))) {
    throw 'JDK nao encontrado. Informe -JavaHome com a pasta jbr do Android Studio ou um JDK 17+.'
}
if (-not (Test-Path -LiteralPath $SdkPath)) { throw 'SDK nao encontrado. Informe -SdkPath com a pasta Android\Sdk.' }
$tools = Get-ChildItem (Join-Path $SdkPath 'build-tools') -Directory |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' } |
    Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
$platform = Get-ChildItem (Join-Path $SdkPath 'platforms') -Directory |
    Where-Object { $_.Name -match '^android-\d+(\.\d+)?$' -and [double]($_.Name -replace 'android-', '') -ge 37 } |
    Sort-Object { [double]($_.Name -replace 'android-', '') } -Descending | Select-Object -First 1
if (-not $tools -or -not $platform) { throw 'Instale Android SDK Platform 37 e Build-Tools 36.0.0+ pelo SDK Manager.' }
$androidJar = Join-Path $platform.FullName 'android.jar'
$buildRoot = Join-Path $projectRoot ('.build\' + [guid]::NewGuid().ToString('N'))
$assets = Join-Path $buildRoot 'assets'
$res = Join-Path $buildRoot 'res'
$classes = Join-Path $buildRoot 'classes'
$dex = Join-Path $buildRoot 'dex'
$generated = Join-Path $buildRoot 'generated'
$output = Join-Path $projectRoot 'output'
$keyDir = Join-Path $projectRoot '.tooling'
@($assets, $res, $classes, $dex, $generated, $output, $keyDir, (Join-Path $res 'drawable')) |
    ForEach-Object { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
# Work from a local copy so JDK archive cleanup does not need access to SDK paths.
$localAndroidJar = Join-Path $buildRoot 'android.jar'
Copy-Item -LiteralPath $androidJar -Destination $localAndroidJar
$androidJar = $localAndroidJar

function Invoke-BuildTool([string]$File, [string[]]$ToolArgs) {
    & $File @ToolArgs
    if ($LASTEXITCODE -ne 0) { throw "Falha em $File (codigo $LASTEXITCODE)" }
}

# Package the current web sources, without installation prompts, remote fonts or SW.
@('index.html', 'game.js', 'style.css', 'manifest.webmanifest') | ForEach-Object {
    Copy-Item -LiteralPath (Join-Path $gameRoot $_) -Destination $assets
}
Copy-Item -LiteralPath (Join-Path $gameRoot 'icons') -Destination $assets -Recurse
$htmlPath = Join-Path $assets 'index.html'
$html = [IO.File]::ReadAllText($htmlPath)
$html = $html -replace '(?m)^.*<script src="pwa.js" defer></script>.*\r?\n', ''
$html = $html -replace '(?m)^.*<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>.*\r?\n', ''
$html = $html.Replace('<head>', '<head><script>window.__ANDROID_APP__ = true;</script>')
[IO.File]::WriteAllText($htmlPath, $html, [Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath (Join-Path $projectRoot 'app\src\main\res\values') -Destination $res -Recurse
Copy-Item -LiteralPath (Join-Path $gameRoot 'icons\icon-192.png') -Destination (Join-Path $res 'drawable\ic_launcher.png')

$manifestPath = Join-Path $buildRoot 'AndroidManifest.xml'
[xml]$manifest = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'app\src\main\AndroidManifest.xml')
$manifest.manifest.SetAttribute('package', 'com.lmracing.f116bits')
$manifest.manifest.application.SetAttribute('debuggable', 'http://schemas.android.com/apk/res/android', 'true') | Out-Null
$manifest.Save($manifestPath)
$resourcesZip = Join-Path $buildRoot 'resources.zip'
$unsigned = Join-Path $buildRoot 'unsigned.apk'
$aligned = Join-Path $buildRoot 'aligned.apk'
$apk = Join-Path $output 'f1-16-bits-debug.apk'

Write-Host '1/5 Preparando recursos e arquivos offline...'
Invoke-BuildTool (Join-Path $tools.FullName 'aapt2.exe') @('compile', '--dir', $res, '-o', $resourcesZip)
Invoke-BuildTool (Join-Path $tools.FullName 'aapt2.exe') @('link', '-o', $unsigned, '-I', $androidJar,
    '--manifest', $manifestPath, '--java', $generated, '-A', $assets, '--min-sdk-version', '23',
    '--target-sdk-version', '36', '--version-code', '1', '--version-name', '0.1.0', $resourcesZip)

Write-Host '2/5 Compilando o aplicativo Android...'
$javaSources = @(Get-ChildItem (Join-Path $projectRoot 'app\src\main\java') -Filter '*.java' -Recurse |
    Select-Object -ExpandProperty FullName)
$javaSources += @(Get-ChildItem $generated -Filter '*.java' -Recurse | Select-Object -ExpandProperty FullName)
Invoke-BuildTool (Join-Path $JavaHome 'bin\javac.exe') (@('-encoding', 'UTF-8', '--release', '17',
    '-classpath', $androidJar, '-d', $classes) + $javaSources)

Write-Host '3/5 Convertendo para DEX...'
$classFiles = @(Get-ChildItem $classes -Filter '*.class' -Recurse | Select-Object -ExpandProperty FullName)
# Run SDK jars directly, avoiding batch wrappers on paths containing spaces.
Invoke-BuildTool (Join-Path $JavaHome 'bin\java.exe') (@('-cp', (Join-Path $tools.FullName 'lib\d8.jar'),
    'com.android.tools.r8.D8', '--min-api', '23', '--lib', $androidJar, '--output', $dex) + $classFiles)
Invoke-BuildTool (Join-Path $JavaHome 'bin\jar.exe') @('uf', $unsigned, '-C', $dex, 'classes.dex')
# Some Windows AAPT2 builds emit backslashes in nested asset entry names.
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$archive = [IO.Compression.ZipFile]::Open($unsigned, [IO.Compression.ZipArchiveMode]::Update)
try {
    $windowsEntries = @($archive.Entries | Where-Object { $_.FullName.Contains('\') })
    foreach ($entry in $windowsEntries) {
        $normalized = $archive.CreateEntry($entry.FullName.Replace('\', '/'))
        $sourceStream = $entry.Open()
        $targetStream = $normalized.Open()
        try { $sourceStream.CopyTo($targetStream) }
        finally { $sourceStream.Dispose(); $targetStream.Dispose() }
        $entry.Delete()
    }
} finally { $archive.Dispose() }
Invoke-BuildTool (Join-Path $tools.FullName 'zipalign.exe') @('-f', '-p', '4', $unsigned, $aligned)

Write-Host '4/5 Assinando APK de desenvolvimento...'
$keystore = Join-Path $keyDir 'debug.keystore'
if (-not (Test-Path -LiteralPath $keystore)) {
    Invoke-BuildTool (Join-Path $JavaHome 'bin\keytool.exe') @('-genkeypair', '-keystore', $keystore,
        '-storepass', 'android', '-keypass', 'android', '-alias', 'androiddebugkey', '-keyalg', 'RSA',
        '-keysize', '2048', '-validity', '10000', '-dname', 'CN=Android Debug,O=Android,C=US', '-noprompt')
}
$signer = Join-Path $tools.FullName 'lib\apksigner.jar'
Invoke-BuildTool (Join-Path $JavaHome 'bin\java.exe') @('-jar', $signer, 'sign', '--ks', $keystore,
    '--ks-key-alias', 'androiddebugkey', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', $apk, $aligned)
Write-Host '5/5 Verificando assinatura e alinhamento...'
Invoke-BuildTool (Join-Path $JavaHome 'bin\java.exe') @('-jar', $signer, 'verify', '--verbose', $apk)
Invoke-BuildTool (Join-Path $tools.FullName 'zipalign.exe') @('-c', '4', $apk)
Write-Host "APK pronto: $apk"
