param(
    [string]$Repo = "$HOME\OneDrive\Documents\GitHub\sum-greatness-build-your-empire",
    [string]$ExportRoot = "$HOME\OneDrive\Documents\SUM_GREATNESS_exports\phone_preview"
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

$founderSource = Join-Path $ExportRoot 'sum-greatness-founder.glb'
$worldSource = Join-Path $ExportRoot 'sum-greatness-world-preview.glb'
$modelDir = Join-Path $Repo 'public\assets\models'
$founderTarget = Join-Path $modelDir 'sum-greatness-founder.glb'
$worldTarget = Join-Path $modelDir 'sum-greatness-world-preview.glb'
$distFounder = Join-Path $Repo 'dist\assets\models\sum-greatness-founder.glb'
$androidFounder = Join-Path $Repo 'android\app\src\main\assets\public\assets\models\sum-greatness-founder.glb'
$logDir = Join-Path $Repo 'blender_bridge\automation\logs'
$logFile = Join-Path $logDir 'phone_preview.log'
New-Item -ItemType Directory -Force -Path $modelDir,$logDir | Out-Null

function Log([string]$message) {
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$stamp] $message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

function Assert-SameFile([string]$expected,[string]$actual,[string]$label) {
    if (-not (Test-Path $actual)) { throw "$label missing: $actual" }
    $expectedHash = (Get-FileHash -Algorithm SHA256 $expected).Hash
    $actualHash = (Get-FileHash -Algorithm SHA256 $actual).Hash
    if ($expectedHash -ne $actualHash) {
        throw "$label hash mismatch. Expected $expectedHash but found $actualHash"
    }
    $bytes = (Get-Item $actual).Length
    Log "$label verified ($bytes bytes, SHA256 $actualHash)"
}

if (-not (Test-Path $founderSource)) {
    throw "Founder preview GLB not found yet: $founderSource"
}
if ((Get-Item $founderSource).Length -lt 1024) {
    throw "Founder preview GLB is unexpectedly small: $founderSource"
}

# These are local generated preview binaries. Keep Git's unattended pull check clean.
$exclude = Join-Path $Repo '.git\info\exclude'
$excludeLines = @(
    'public/assets/models/sum-greatness-founder.glb',
    'public/assets/models/sum-greatness-world-preview.glb'
)
foreach ($line in $excludeLines) {
    if (-not (Select-String -Path $exclude -SimpleMatch $line -Quiet -ErrorAction SilentlyContinue)) {
        Add-Content -Path $exclude -Value $line
    }
}

Copy-Item $founderSource $founderTarget -Force
Assert-SameFile $founderSource $founderTarget 'Public founder GLB'
if (Test-Path $worldSource) {
    Copy-Item $worldSource $worldTarget -Force
    Log "World preview copied to public/assets/models/sum-greatness-world-preview.glb"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is not available in PATH.'
}
if (-not (Test-Path (Join-Path $Repo 'node_modules'))) {
    Log 'node_modules missing; running npm install'
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
}

Log 'Running Vite production build'
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
Assert-SameFile $founderSource $distFounder 'Vite dist founder GLB'

Log 'Syncing web build and preview assets to Android with Capacitor'
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "npx cap sync android failed with exit code $LASTEXITCODE" }
Assert-SameFile $founderSource $androidFounder 'Android packaged founder GLB'

Log 'PHONE PREVIEW BUILD PREP COMPLETE. Founder GLB is byte-for-byte verified in public, dist, and Android assets. Open Android Studio and Run on the connected phone.'
