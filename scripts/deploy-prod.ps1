# Deploy production stack using docker-compose.prod.yml
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

docker compose --env-file $EnvFile -f $composeFile pull
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) { Write-Host "Warning: pull failed or no registry configured; building locally..." -ForegroundColor Yellow }

docker compose --env-file $EnvFile -f $composeFile up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Stack is starting. Use 'docker compose -f $composeFile ps' to check status." -ForegroundColor Green
