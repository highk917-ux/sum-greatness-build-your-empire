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
$logDir = Join-Path $Repo 'blender_bridge\automation\logs'
$logFile = Join-Path $logDir 'phone_preview.log'
New-Item -ItemType Directory -Force -Path $modelDir,$logDir | Out-Null

function Log([string]$message) {
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$stamp] $message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

if (-not (Test-Path $founderSource)) {
    throw "Founder preview GLB not found yet: $founderSource"
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
Log "Founder preview copied to public/assets/models/sum-greatness-founder.glb"
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

Log 'Syncing web build and preview assets to Android with Capacitor'
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "npx cap sync android failed with exit code $LASTEXITCODE" }

Log 'PHONE PREVIEW BUILD PREP COMPLETE. Open Android Studio and Run on the connected phone.'
