param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    [Parameter(Mandatory=$true)]
    [string]$Time,
    [string]$Date = (Get-Date -Format "yyyy-MM-dd"),
    [string]$Message = ""
)

$datetime = [datetime]::ParseExact("$Date $Time", "yyyy-MM-dd HH:mm", $null)

if ($datetime -lt (Get-Date)) {
    Write-Host "skip: $datetime (already past)" -ForegroundColor Yellow
    exit 0
}

$notifyScript = @"
Add-Type -AssemblyName System.Windows.Forms
`$notify = New-Object System.Windows.Forms.NotifyIcon
`$notify.Icon = [System.Drawing.SystemIcons]::Information
`$notify.Visible = `$true
`$notify.BalloonTipTitle = "$Title"
`$notify.BalloonTipText = "$Message  [$Time kaishi]"
`$notify.BalloonTipIcon = "Info"
`$notify.ShowBalloonTip(10000)
Start-Sleep -Seconds 12
`$notify.Dispose()
"@

$scriptDir2 = "$env:APPDATA\ClaudeReminders"
if (!(Test-Path $scriptDir2)) {
    New-Item -ItemType Directory -Path $scriptDir2 | Out-Null
}

$safeName = ($Title -replace '[\\/:*?"<>|]', '_')
$scriptPath = "$scriptDir2\notify_${safeName}_$($datetime.ToString('yyyyMMdd_HHmm')).ps1"
$notifyScript | Out-File -FilePath $scriptPath -Encoding UTF8

$taskName = "ClaudeReminder_${safeName}_$($datetime.ToString('yyyyMMdd_HHmm'))"

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Once -At $datetime

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Force | Out-Null

Write-Host "  OK: $Title - $($datetime.ToString('HH:mm')) toroku" -ForegroundColor Green
