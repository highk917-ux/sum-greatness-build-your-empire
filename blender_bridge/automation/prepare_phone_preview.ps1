param(
    [string]$Repo = "$HOME\OneDrive\Documents\GitHub\sum-greatness-build-your-empire",
    [string]$ExportRoot = "$HOME\OneDrive\Documents\SUM_GREATNESS_exports\phone_preview"
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

$founderSource = Join-Path $ExportRoot 'sum-greatness-founder.glb'
$worldSource = Join-Path $ExportRoot 'sum-greatness-world-preview.glb'
$manifestSource = Join-Path $ExportRoot 'phone_preview_manifest.json'
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

function Assert-Glb([string]$path,[string]$label) {
    if (-not (Test-Path $path)) { throw "$label missing: $path" }
    $bytes = [System.IO.File]::ReadAllBytes($path)
    if ($bytes.Length -lt 20) { throw "$label is too small to be a valid GLB: $($bytes.Length) bytes" }
    $magic = [System.Text.Encoding]::ASCII.GetString($bytes,0,4)
    if ($magic -ne 'glTF') { throw "$label is not a GLB file (missing glTF magic header): $path" }
    $version = [BitConverter]::ToUInt32($bytes,4)
    $declaredLength = [BitConverter]::ToUInt32($bytes,8)
    if ($version -ne 2) { throw "$label uses unsupported GLB version $version; expected version 2" }
    if ($declaredLength -ne $bytes.Length) { throw "$label length header mismatch. Header=$declaredLength Actual=$($bytes.Length)" }
    Log "$label structure verified as GLB v$version ($($bytes.Length) bytes)"
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

if (-not (Test-Path $manifestSource)) {
    throw "Phone preview manifest not found. Run Blender bridge first: $manifestSource"
}
try {
    $manifest = Get-Content $manifestSource -Raw | ConvertFrom-Json
} catch {
    throw "Phone preview manifest is not valid JSON: $manifestSource"
}
if ($manifest.founder_status -ne 'exported') {
    throw "Blender did not report a successful founder export. founder_status=$($manifest.founder_status)"
}
if (-not $manifest.founder_rig_ready) {
    throw "Founder export is not rig-ready. hero_bone_count=$($manifest.hero_bone_count) skinned_mesh_count=$($manifest.skinned_mesh_count). Fix the rig/export before Android packaging."
}
Log "Founder manifest verified: bones=$($manifest.hero_bone_count), skinned_meshes=$($manifest.skinned_mesh_count), pose_actions=$($manifest.pose_action_count)"
if (-not $manifest.founder_animation_ready) {
    $missing = @($manifest.animation_missing) -join ', '
    Log "WARNING: Founder is rigged but the complete animation set is not ready. Missing: $missing"
}

if (-not (Test-Path $founderSource)) {
    throw "Founder preview GLB not found yet: $founderSource"
}
if ((Get-Item $founderSource).Length -lt 1024) {
    throw "Founder preview GLB is unexpectedly small: $founderSource"
}
if ([int64]$manifest.founder_glb_bytes -ne (Get-Item $founderSource).Length) {
    throw "Founder GLB byte count does not match the Blender manifest. Re-run the Blender export before packaging."
}
Assert-Glb $founderSource 'Founder source GLB'

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
Assert-Glb $founderTarget 'Public founder GLB'
Assert-SameFile $founderSource $founderTarget 'Public founder GLB'
if (Test-Path $worldSource) {
    Assert-Glb $worldSource 'World preview GLB'
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

Log 'Running interaction and animation foundation tests'
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }

Log 'Running Vite production build'
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
Assert-Glb $distFounder 'Vite dist founder GLB'
Assert-SameFile $founderSource $distFounder 'Vite dist founder GLB'

Log 'Syncing web build and preview assets to Android with Capacitor'
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "npx cap sync android failed with exit code $LASTEXITCODE" }
Assert-Glb $androidFounder 'Android packaged founder GLB'
Assert-SameFile $founderSource $androidFounder 'Android packaged founder GLB'

Log 'PHONE PREVIEW BUILD PREP COMPLETE. Founder rig manifest passed; GLB is structurally valid and byte-for-byte verified in public, dist, and Android assets. Open Android Studio and Run on the connected phone.'
