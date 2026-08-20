param(
    [int]$Port = 3000
)

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

$listener = $null
$boundPort = $Port
for ($i = 0; $i -lt 10; $i++) {
    try {
        $p = $Port + $i
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$p/")
        $listener.Prefixes.Add("http://127.0.0.1:$p/")
        $listener.Start()
        $boundPort = $p
        break
    } catch {
        if ($listener) { $listener.Close() }
        $listener = $null
    }
}

if (-not $listener -or -not $listener.IsListening) {
    Write-Host "[Error] Could not bind HTTP listener." -ForegroundColor Red
    exit 1
}

Set-Content -Path (Join-Path $root ".active_port") -Value "$boundPort" -Force

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = [System.Uri]::UnescapeDataString($request.RawUrl.Split('?')[0])
        if ($rawUrl -eq "/" -or $rawUrl -eq "/index.html" -or $rawUrl -eq "/app.html") {
            $rawUrl = "/app.html"
        }

        $relPath = $rawUrl.TrimStart("/\").Replace("/", "\")
        $filePath = Join-Path $root $relPath

        if (-not (Test-Path $filePath -PathType Leaf)) {
            $distPath = Join-Path (Join-Path $root "dist") $relPath
            if (Test-Path $distPath -PathType Leaf) {
                $filePath = $distPath
            } else {
                $filePath = Join-Path $root "app.html"
            }
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {}
}
