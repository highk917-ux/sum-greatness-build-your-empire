param(
    [string]$Repo = "$HOME\OneDrive\Documents\GitHub\sum-greatness-build-your-empire",
    [string]$Branch = "blender-github-bridge",
    [string]$BlendFile = "$HOME\OneDrive\Documents\sum-greatness-founder-restored.blend",
    [int]$PollSeconds = 300
)

$ErrorActionPreference = 'Stop'
$stateDir = Join-Path $Repo 'blender_bridge\automation\state'
$logDir = Join-Path $Repo 'blender_bridge\automation\logs'
$backupDir = Join-Path $Repo 'blender_bridge\automation\backups'
New-Item -ItemType Directory -Force -Path $stateDir,$logDir,$backupDir | Out-Null
$stateFile = Join-Path $stateDir 'last_executed_commit.txt'

function Write-RunnerLog([string]$message) {
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$stamp] $message"
    Write-Host $line
    Add-Content -Path (Join-Path $logDir 'runner.log') -Value $line
}

function Find-Blender {
    $candidates = @(
        'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe',
        'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe',
        'C:\Program Files\Blender Foundation\Blender 5.0\blender.exe',
        'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'
    )
    foreach ($candidate in $candidates) { if (Test-Path $candidate) { return $candidate } }
    $found = Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($found) { return $found }
    throw 'Blender executable not found.'
}

if (-not (Test-Path $Repo)) { throw "Repo not found: $Repo" }
if (-not (Test-Path $BlendFile)) { throw "Blend file not found: $BlendFile" }
$blender = Find-Blender
$bridge = Join-Path $Repo 'blender_bridge\run_latest.py'

Write-RunnerLog "SUM GREATNESS unattended runner started. Blender=$blender"
Write-RunnerLog "Repo=$Repo Branch=$Branch Blend=$BlendFile Poll=${PollSeconds}s"

while ($true) {
    try {
        Set-Location $Repo
        $dirty = git status --porcelain
        if ($dirty) {
            Write-RunnerLog 'Local Git changes detected; skipping automatic pull to protect work.'
            Start-Sleep -Seconds $PollSeconds
            continue
        }

        git fetch origin $Branch | Out-Null
        git checkout $Branch | Out-Null
        git pull --ff-only origin $Branch | Out-Null
        $commit = (git rev-parse HEAD).Trim()
        $last = if (Test-Path $stateFile) { (Get-Content $stateFile -Raw).Trim() } else { '' }

        if ($commit -ne $last) {
            Write-RunnerLog "New Blender task commit detected: $commit"
            $backupName = "sum-greatness-founder-restored_$(Get-Date -Format 'yyyyMMdd_HHmmss').blend"
            Copy-Item $BlendFile (Join-Path $backupDir $backupName) -Force
            Write-RunnerLog "Backup created: $backupName"

            $runLog = Join-Path $logDir ("blender_" + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.log')
            & $blender $BlendFile --background --python $bridge *> $runLog
            if ($LASTEXITCODE -ne 0) { throw "Blender exited with code $LASTEXITCODE. See $runLog" }

            Set-Content -Path $stateFile -Value $commit
            Write-RunnerLog "Blender task completed successfully for $commit"
        }
    }
    catch {
        Write-RunnerLog ("ERROR: " + $_.Exception.Message)
    }
    Start-Sleep -Seconds $PollSeconds
}
