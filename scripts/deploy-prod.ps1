# Deploy production stack using docker-compose.prod.yml (image-only, no local rebuilds)
param(
    [string]$EnvFile = ".env"
)

if (!(Test-Path $EnvFile)) {
    Write-Host "Missing $EnvFile. Copy .env.example to $EnvFile and edit values." -ForegroundColor Yellow
    exit 1
}

$composeFile = "docker-compose.prod.yml"
if (!(Test-Path $composeFile)) {
    Write-Host "Missing $composeFile" -ForegroundColor Red
    exit 1
}

Write-Host "Starting production stack..." -ForegroundColor Cyan
$env:COMPOSE_PROJECT_NAME = "alchaar-kiosk"

docker compose --env-file $EnvFile -f $composeFile pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "Image pull failed. Aborting (local rebuilds are disabled)." -ForegroundColor Red
    exit $LASTEXITCODE
}

docker compose --env-file $EnvFile -f $composeFile up -d --no-build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Stack is starting. Use 'docker compose -f $composeFile ps' to check status." -ForegroundColor Green
