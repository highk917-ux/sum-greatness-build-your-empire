param(
    [string]$Repo = "$HOME\OneDrive\Documents\GitHub\sum-greatness-build-your-empire"
)

$ErrorActionPreference = 'Stop'
$runner = Join-Path $Repo 'blender_bridge\automation\auto_blender_runner.ps1'
if (-not (Test-Path $runner)) { throw "Runner not found: $runner" }

$taskName = 'SUMGreatnessBlenderRunner'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runner`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Automatically pulls approved SUM GREATNESS Blender tasks from GitHub and runs them with backups.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Host "Installed and started $taskName"
Write-Host 'The runner checks GitHub about every 5 minutes while Windows is awake and logged in.'
Write-Host 'It skips automatic pulls if local Git changes are present and creates a .blend backup before every new task.'
