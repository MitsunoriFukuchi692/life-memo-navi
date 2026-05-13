# Immediate notification via scheduled task (runs as current user)
$notifyScript = @'
Add-Type -AssemblyName System.Windows.Forms
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Visible = $true
$notify.BalloonTipTitle = "ZOO会議リマインダー"
$notify.BalloonTipText = "【午前のリマインダー】今日18:30からZOO会議があります。準備をお忘れなく！"
$notify.BalloonTipIcon = "Info"
$notify.ShowBalloonTip(15000)
Start-Sleep -Seconds 16
$notify.Dispose()
'@

$scriptPath = "$env:TEMP\zoo_notify_balloon.ps1"
$notifyScript | Out-File -FilePath $scriptPath -Encoding UTF8

$taskName = "ZOO_Morning_Reminder_Now"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddSeconds(5))
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DeleteExpiredTaskAfter (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "通知タスクを登録しました。5秒後に通知が表示されます。"
