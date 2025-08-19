# Update production stack by pulling latest image or rebuilding
param(
    [string]$EnvFile = ".env"
)

$composeFile = "docker-compose.prod.yml"
if (!(Test-Path $composeFile)) { Write-Host "Missing $composeFile" -ForegroundColor Red; exit 1 }

Write-Host "Updating production stack..." -ForegroundColor Cyan
$env:COMPOSE_PROJECT_NAME = "alchaar-kiosk"

# Pre-update backup (abort on failure)
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "preupdate-$ts.sql.gz"
Write-Host "Creating pre-update DB backup: $backupName" -ForegroundColor Yellow
& "$PSScriptRoot/backup-db.ps1" -EnvFile $EnvFile -BackupName $backupName
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pre-update backup failed. Aborting update." -ForegroundColor Red
    exit 1
}

docker compose --env-file $EnvFile -f $composeFile pull

docker compose --env-file $EnvFile -f $composeFile up -d --build

# Cleanup old images
Write-Host "Pruning unused images (optional)..." -ForegroundColor Yellow
docker image prune -f
