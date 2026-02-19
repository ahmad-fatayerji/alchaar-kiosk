# Update production stack by pulling latest image or rebuilding
param(
    [string]$EnvFile = ".env"
)

$composeFile = "docker-compose.prod.yml"
if (!(Test-Path $composeFile)) { Write-Host "Missing $composeFile" -ForegroundColor Red; exit 1 }

Write-Host "Updating production stack..." -ForegroundColor Cyan
$env:COMPOSE_PROJECT_NAME = "alchaar-kiosk"

if (-not $env:APP_GIT_SHA) {
    $gitSha = git rev-parse HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $gitSha) { $env:APP_GIT_SHA = $gitSha.Trim() }
}
if (-not $env:APP_GIT_REF) {
    $gitRef = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $gitRef) { $env:APP_GIT_REF = $gitRef.Trim() }
}
if (-not $env:APP_BUILD_TIME) {
    $env:APP_BUILD_TIME = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

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

# Run migrations in the app container (build DATABASE_URL from POSTGRES_* inside container)
Write-Host "Running Prisma migrations..." -ForegroundColor Yellow
docker compose --env-file $EnvFile -f $composeFile exec app sh -lc 'DATABASE_URL="postgresql://${POSTGRES_USER:-kiosk}:${POSTGRES_PASSWORD:-secret}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-pharmacy}?schema=public" npx prisma migrate deploy'
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prisma migrate deploy failed. Aborting update." -ForegroundColor Red
    exit 1
}

# Cleanup old images
Write-Host "Pruning unused images (optional)..." -ForegroundColor Yellow        
docker image prune -f
