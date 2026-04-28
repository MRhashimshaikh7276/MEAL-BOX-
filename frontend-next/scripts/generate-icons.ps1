$data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
$bytes = [Convert]::FromBase64String($data)
$sizes = @('72','96','128','144','152','192','384','512')
$iconFolder = Join-Path $PWD 'public\icons'
foreach ($size in $sizes) {
    $filename = "icon-$size`x$size.png"
    $path = Join-Path $iconFolder $filename
    [IO.File]::WriteAllBytes($path, $bytes)
    Write-Host "Wrote $path"
}
