param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    [Parameter(Mandatory=$true)]
    [string]$StartTime,
    [string]$Date = (Get-Date -Format "yyyy-MM-dd")
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$remindScript = Join-Path $scriptDir "remind.ps1"

$startDt = [datetime]::ParseExact("$Date $StartTime", "yyyy-MM-dd HH:mm", $null)
$now = Get-Date

Write-Host ""
Write-Host "[$Title] $($startDt.ToString('yyyy/MM/dd HH:mm')) no reminder wo toroku shimasu" -ForegroundColor Cyan
Write-Host ""

$registered = 0

$morning = [datetime]::ParseExact("$Date 10:00", "yyyy-MM-dd HH:mm", $null)
if ($morning -gt $now) {
    & $remindScript -Title $Title -Time "10:00" -Date $Date -Message "Kyo $StartTime kara yotei ga arimasu"
    $registered++
} else {
    Write-Host "   skip: 10:00 (already past)" -ForegroundColor Gray
}

$afternoon = [datetime]::ParseExact("$Date 14:00", "yyyy-MM-dd HH:mm", $null)
if ($afternoon -gt $now) {
    & $remindScript -Title $Title -Time "14:00" -Date $Date -Message "Kyo $StartTime kara yotei ga arimasu"
    $registered++
} else {
    Write-Host "   skip: 14:00 (already past)" -ForegroundColor Gray
}

$before15 = $startDt.AddMinutes(-15)
$before15Time = $before15.ToString("HH:mm")
if ($before15 -gt $now) {
    & $remindScript -Title $Title -Time $before15Time -Date $Date -Message "Ato 15fun de kaishi desu!"
    $registered++
} else {
    Write-Host "   skip: 15min before (already past)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Toroku kanryo: $registered ken" -ForegroundColor Green
Write-Host ""
