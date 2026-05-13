# week-reminder.ps1
# Weekly schedule reminder registration tool

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$addReminder = Join-Path $scriptDir "add-reminder.ps1"

Write-Host ""
Write-Host "=== Weekly Reminder Registration ===" -ForegroundColor Cyan
Write-Host "Enter your schedule. Type 'done' when finished." -ForegroundColor Gray
Write-Host ""

# Show next 7 days for reference
Write-Host "--- Next 7 days ---" -ForegroundColor Yellow
for ($i = 0; $i -le 6; $i++) {
    $d = (Get-Date).AddDays($i)
    Write-Host "  $($d.ToString('yyyy-MM-dd')) ($($d.ToString('ddd')))" -ForegroundColor Gray
}
Write-Host ""

$count = 0

while ($true) {
    Write-Host "--- Schedule #$($count + 1) ---" -ForegroundColor Cyan

    # Date input
    $dateInput = Read-Host "Date (yyyy-MM-dd, or 'today'/'tomorrow', or 'done' to finish)"

    if ($dateInput -eq "done" -or $dateInput -eq "") {
        break
    }

    # Normalize full-width characters to half-width
    $dateInput = $dateInput -replace '－', '-' -replace '‐', '-'
    $dateInput = [System.Text.RegularExpressions.Regex]::Replace($dateInput, '[０-９]', {
        param($m) [char]([int][char]($m.Value[0]) - 0xFF10 + 0x30)
    })

    # Shortcut keywords
    if ($dateInput -eq "today") {
        $dateInput = (Get-Date -Format "yyyy-MM-dd")
    } elseif ($dateInput -eq "tomorrow") {
        $dateInput = ((Get-Date).AddDays(1).ToString("yyyy-MM-dd"))
    } elseif ($dateInput -match "^\d$") {
        # Single digit = days from now
        $dateInput = ((Get-Date).AddDays([int]$dateInput).ToString("yyyy-MM-dd"))
    }

    # Validate date format
    try {
        $parsedDate = [datetime]::ParseExact($dateInput, "yyyy-MM-dd", $null)
    } catch {
        Write-Host "  Invalid date format. Please use yyyy-MM-dd." -ForegroundColor Red
        continue
    }

    # Title input
    $title = Read-Host "Title (e.g. ZOO meeting)"
    if ($title -eq "") {
        Write-Host "  Title is required." -ForegroundColor Red
        continue
    }

    # Time input
    $time = Read-Host "Start time (HH:MM, e.g. 18:30)"
    # Normalize full-width to half-width
    $time = $time -replace '：', ':' -replace '０','0' -replace '１','1' -replace '２','2' -replace '３','3' -replace '４','4' -replace '５','5' -replace '６','6' -replace '７','7' -replace '８','8' -replace '９','9'
    $time = $time.Trim()
    if ($time -notmatch "^\d{1,2}:\d{2}$") {
        Write-Host "  Invalid time format. Please enter like 18:30 or 9:00." -ForegroundColor Red
        continue
    }
    # Pad single-digit hour to two digits
    if ($time -match "^\d:\d{2}$") { $time = "0$time" }

    # Register
    Write-Host ""
    & $addReminder -Title $title -StartTime $time -Date $dateInput
    $count++
    Write-Host ""
}

Write-Host ""
if ($count -gt 0) {
    Write-Host "=== Done! Registered $count schedule(s). ===" -ForegroundColor Green
} else {
    Write-Host "No schedules registered." -ForegroundColor Yellow
}
Write-Host ""
