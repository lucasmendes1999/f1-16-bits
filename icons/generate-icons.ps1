# Rasterize the same code-native geometry as brand-mark.svg; no external tools.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$polygons = @(
    @{ Color='#f33855'; Points=@(112,160,162,160,132,290,214,290,202,338,70,338) },
    @{ Color='#eaf4f7'; Points=@(245,160,294,160,319,228,376,160,434,160,393,338,343,338,365,241,308,305,281,241,259,338,204,338) },
    @{ Color='#35dfce'; Points=@(93,108,210,108,202,132,85,132) },
    @{ Color='#35dfce'; Points=@(71,365,317,365,310,389,64,389) },
    @{ Color='#ffe15a'; Points=@(348,365,373,365,373,390,348,390) },
    @{ Color='#ffe15a'; Points=@(398,365,423,365,423,390,398,390) },
    @{ Color='#ffe15a'; Points=@(373,390,398,390,398,415,373,415) }
)
$outputs = @{'icon-192.png'=192; 'icon-512.png'=512; 'icon-maskable-512.png'=512; 'apple-touch-icon.png'=180}
foreach ($name in $outputs.Keys) {
    $size = $outputs[$name]
    $bitmap = [Drawing.Bitmap]::new($size,$size)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.Clear([Drawing.ColorTranslator]::FromHtml('#0b1320'))
        $graphics.ScaleTransform($size / 512.0,$size / 512.0)
        # Keep the whole mark inside the maskable icon safe zone.
        $graphics.TranslateTransform(256,256)
        $graphics.ScaleTransform(0.8,0.8)
        $graphics.TranslateTransform(-256,-256)
        foreach ($polygon in $polygons) {
            $points = [Drawing.PointF[]]@(for ($i=0; $i -lt $polygon.Points.Count; $i+=2) {
                [Drawing.PointF]::new($polygon.Points[$i],$polygon.Points[$i+1])
            })
            $brush = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($polygon.Color))
            try { $graphics.FillPolygon($brush,$points) } finally { $brush.Dispose() }
        }
        $bitmap.Save((Join-Path $PSScriptRoot $name),[Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
