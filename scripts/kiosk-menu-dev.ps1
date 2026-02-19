# Alchaar Kiosk DEV Manager (Windows)
# Interactive menu for local dev DB stack and backup/restore operations.

$ErrorActionPreference = 'Stop'

function Set-Title {
    try { $host.UI.RawUI.WindowTitle = "Alchaar Kiosk DEV Manager" } catch {}
}

function Get-RootPath { (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }
function Get-ComposePath { Join-Path (Get-RootPath) 'docker-compose.dev.yml' }

function Get-EnvPath([string]$envFile) {
    if ([string]::IsNullOrWhiteSpace($envFile)) { $envFile = '.env.development.local' }
    $root = Get-RootPath
    return (Join-Path $root $envFile)
}

function Ensure-Docker {
    try { docker --version | Out-Null }
    catch {
        Write-Host "Docker Desktop is not installed or not running. Please install/start Docker Desktop." -ForegroundColor Red
        Read-Host "Press Enter to continue"
        throw
    }
}

function Ensure-Env([string]$envFile) {
    $envPath = Get-EnvPath $envFile
    if (-not (Test-Path $envPath)) {
        Write-Host "Missing $envFile. Create it first (recommended: .env.development.local)." -ForegroundColor Red
        throw
    }
}

function Run-Compose([string]$envFile, [string[]]$composeArgs) {
    $compose = Get-ComposePath
    $envPath = Get-EnvPath $envFile
    $cmd = @('compose', '--env-file', $envPath, '-f', $compose) + $composeArgs
    Write-Host "> docker $($cmd -join ' ')" -ForegroundColor DarkGray
    docker @cmd
}

function Backup-DB([string]$envFile) {
    Ensure-Docker; Ensure-Env $envFile
    $root = Get-RootPath
    $backupScript = Join-Path $root 'scripts/backup-db-dev.ps1'
    $name = Read-Host "Optional: Enter backup name (or leave blank for timestamped)"
    if ([string]::IsNullOrWhiteSpace($name)) {
        & $backupScript -EnvFile (Split-Path (Get-EnvPath $envFile) -Leaf)
    }
    else {
        & $backupScript -EnvFile (Split-Path (Get-EnvPath $envFile) -Leaf) -BackupName $name
    }
    if ($LASTEXITCODE -ne 0) { Write-Host "DEV backup failed." -ForegroundColor Red } else { Write-Host "DEV backup created." -ForegroundColor Green }
}

function Restore-DB([string]$envFile) {
    Ensure-Docker; Ensure-Env $envFile
    Write-Host "Restore source:" -ForegroundColor White
    Write-Host "  1) From dev backups volume (list)"
    Write-Host "  2) From file path (.sql or .sql.gz)"
    $source = Read-Host "Choose restore source (1/2)"
    $backupName = $null

    if ($source -eq '1') {
        try {
            $list = Run-Compose $envFile @('exec', '-T', 'db', 'bash', '-lc', 'ls -1 /backups 2>/dev/null') | Where-Object { $_ -ne '' }
        }
        catch {
            $list = @()
        }
        if (-not $list -or $list.Count -eq 0) {
            Write-Host "No backups found in the dev backups volume." -ForegroundColor Yellow
            return
        }
        Write-Host "Available backups:" -ForegroundColor Cyan
        for ($i = 0; $i -lt $list.Count; $i++) {
            Write-Host ("[{0}] {1}" -f ($i + 1), $list[$i])
        }
        $choice = Read-Host "Enter the number to restore"
        if (-not [int]::TryParse($choice, [ref]$null)) { Write-Host "Invalid selection." -ForegroundColor Red; return }
        $index = [int]$choice - 1
        if ($index -lt 0 -or $index -ge $list.Count) { Write-Host "Out of range." -ForegroundColor Red; return }
        $backupName = $list[$index]
    }
    elseif ($source -eq '2') {
        Write-Host "Examples:"
        Write-Host "  C:\backups\kiosk-dev-backup.sql.gz"
        Write-Host "  .\backups\kiosk-dev-backup.sql"
        $path = Read-Host "Enter full path to backup file"
        $path = $path.Trim()
        if (($path.StartsWith('"') -and $path.EndsWith('"')) -or ($path.StartsWith("'") -and $path.EndsWith("'"))) {
            $path = $path.Substring(1, $path.Length - 2)
        }
        if ([string]::IsNullOrWhiteSpace($path)) { Write-Host "Cancelled." -ForegroundColor Yellow; return }
        if (-not (Test-Path $path)) { Write-Host "File not found: $path" -ForegroundColor Red; return }
        $backupName = Split-Path $path -Leaf
        Write-Host "Copying $backupName to dev backups volume..." -ForegroundColor Cyan
        Run-Compose $envFile @('cp', $path, "db:/backups/$backupName")
        if ($LASTEXITCODE -ne 0) { Write-Host "Copy failed." -ForegroundColor Red; return }
    }
    else {
        Write-Host "Invalid selection." -ForegroundColor Red
        return
    }

    $confirm = Read-Host "This will overwrite DEV database. Type YES to continue"
    if ($confirm -ne 'YES') { Write-Host "Cancelled." -ForegroundColor Yellow; return }

    $root = Get-RootPath
    $restoreScript = Join-Path $root 'scripts/restore-db-dev.ps1'
    & $restoreScript -EnvFile (Split-Path (Get-EnvPath $envFile) -Leaf) -BackupName $backupName
    if ($LASTEXITCODE -ne 0) { Write-Host "DEV restore failed." -ForegroundColor Red } else { Write-Host "DEV restore completed." -ForegroundColor Green }
}

function Show-Status([string]$envFile) { Ensure-Docker; Run-Compose $envFile @('ps') }
function Show-Logs([string]$envFile) {
    Ensure-Docker
    Write-Host "Showing last 200 lines of DEV db logs..." -ForegroundColor Cyan
    Run-Compose $envFile @('logs', '--tail', '200', 'db')
    $f = Read-Host "Follow logs? (y/N)"
    if ($f -match '^(y|yes)$') {
        Write-Host "Press Ctrl+C to stop following logs..." -ForegroundColor Yellow
        Run-Compose $envFile @('logs', '-f', 'db')
    }
}
function Start-Stack([string]$envFile) { Ensure-Docker; Run-Compose $envFile @('up', '-d', 'db') }
function Stop-Stack([string]$envFile) { Ensure-Docker; Run-Compose $envFile @('down') }
function Show-Config([string]$envFile) { Ensure-Docker; Run-Compose $envFile @('config') }

function Main {
    Set-Title
    $envFile = '.env.development.local'
    do {
        Clear-Host
        Set-Title
        Write-Host "==================================" -ForegroundColor DarkCyan
        Write-Host "  Alchaar Kiosk DEV Manager" -ForegroundColor Cyan
        Write-Host "==================================" -ForegroundColor DarkCyan
        Write-Host "Using env file: $envFile" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Select an option:" -ForegroundColor White
        Write-Host "  1) Start dev DB"
        Write-Host "  2) Stop dev stack"
        Write-Host "  3) Backup dev database"
        Write-Host "  4) Restore dev database"
        Write-Host "  5) Show dev status"
        Write-Host "  6) Show dev db logs"
        Write-Host "  7) Show resolved dev config"
        Write-Host "  E) Change env file (current: $envFile)"
        Write-Host "  X) Exit"
        $choice = Read-Host "Enter choice"

        try {
            switch -Regex ($choice) {
                '^1$' { Start-Stack $envFile }
                '^2$' { Stop-Stack $envFile }
                '^3$' { Backup-DB $envFile }
                '^4$' { Restore-DB $envFile }
                '^5$' { Show-Status $envFile }
                '^6$' { Show-Logs $envFile }
                '^7$' { Show-Config $envFile }
                '^(E|e)$' {
                    $newEnv = Read-Host "Enter env filename (e.g., .env.development.local)"
                    if (-not [string]::IsNullOrWhiteSpace($newEnv)) { $envFile = $newEnv }
                }
                '^(X|x)$' { return }
                default { Write-Host "Unknown option." -ForegroundColor Yellow }
            }
        }
        catch {
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }

        Write-Host ""
        Read-Host "Press Enter to return to menu"
    } while ($true)
}

Main
