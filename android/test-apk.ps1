param([string]$ApkPath = (Join-Path $PSScriptRoot 'output\lm-retro-racing-debug.apk'))
$ErrorActionPreference = 'Stop'
$bytes = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $ApkPath).Path)
$end = -1
for ($offset = $bytes.Length - 22; $offset -ge [Math]::Max(0, $bytes.Length - 65557); $offset--) {
    if ([BitConverter]::ToUInt32($bytes, $offset) -eq 0x06054b50 -and
        $offset + 22 + [BitConverter]::ToUInt16($bytes, $offset + 20) -eq $bytes.Length) { $end = $offset; break }
}
if ($end -lt 0) { throw 'APK: diretorio ZIP ausente.' }
$entryCount = [BitConverter]::ToUInt16($bytes, $end + 10)
$central = [int][BitConverter]::ToUInt32($bytes, $end + 16)
$names = [Collections.Generic.HashSet[string]]::new()
for ($index = 0; $index -lt $entryCount; $index++) {
    if ([BitConverter]::ToUInt32($bytes, $central) -ne 0x02014b50) { throw 'APK: diretorio ZIP invalido.' }
    $nameSize = [BitConverter]::ToUInt16($bytes, $central + 28)
    $name = [Text.Encoding]::UTF8.GetString($bytes, $central + 46, $nameSize)
    $flags = [BitConverter]::ToUInt16($bytes, $central + 8)
    $method = [BitConverter]::ToUInt16($bytes, $central + 10)
    $local = [int][BitConverter]::ToUInt32($bytes, $central + 42)
    if (-not $names.Add($name) -or $name.Contains('\')) { throw "APK: caminho duplicado ou invalido: $name" }
    if ([BitConverter]::ToUInt32($bytes, $local) -ne 0x04034b50) { throw "APK: cabecalho local ausente: $name" }
    # Application entries are stored; apksigner may compress its META-INF signatures.
    if (-not $name.StartsWith('META-INF/')) {
    if (($flags -band 8) -or $method -ne 0) { throw "APK: entrada deve estar STORED e sem data descriptor: $name" }
    if ($flags -ne [BitConverter]::ToUInt16($bytes, $local + 6) -or
        $method -ne [BitConverter]::ToUInt16($bytes, $local + 8) -or
        [BitConverter]::ToUInt32($bytes, $central + 16) -ne [BitConverter]::ToUInt32($bytes, $local + 14) -or
        [BitConverter]::ToUInt32($bytes, $central + 20) -ne [BitConverter]::ToUInt32($bytes, $local + 18) -or
        [BitConverter]::ToUInt32($bytes, $central + 24) -ne [BitConverter]::ToUInt32($bytes, $local + 22)) {
        throw "APK: metadados locais e centrais inconsistentes: $name"
    }
    }
    $localNameSize = [BitConverter]::ToUInt16($bytes, $local + 26)
    if ($name -ne [Text.Encoding]::UTF8.GetString($bytes, $local + 30, $localNameSize)) { throw "APK: nome local inconsistente: $name" }
    $dataOffset = $local + 30 + $localNameSize + [BitConverter]::ToUInt16($bytes, $local + 28)
    if ($name -in @('resources.arsc', 'classes.dex') -and $dataOffset % 4 -ne 0) { throw "APK: entrada sem alinhamento: $name" }
    if ($name -eq 'classes.dex' -and [Text.Encoding]::ASCII.GetString($bytes, $dataOffset, 4) -ne "dex`n") { throw 'APK: DEX invalido.' }
    $central += 46 + $nameSize + [BitConverter]::ToUInt16($bytes, $central + 30) + [BitConverter]::ToUInt16($bytes, $central + 32)
}
@('AndroidManifest.xml', 'resources.arsc', 'classes.dex', 'assets/index.html', 'assets/game.js',
    'assets/style.css', 'assets/icons/icon-192.png') | ForEach-Object {
    if (-not $names.Contains($_)) { throw "APK: arquivo obrigatorio ausente: $_" }
}
Write-Host "PASS: $entryCount entradas ZIP consistentes; DEX e resources.arsc armazenados e alinhados."
