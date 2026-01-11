# Create a timestamped Postgres dump inside the db container into /backups
param(
  [string]$EnvFile = ".env",
  [string]$BackupName
)

$composeFile = "docker-compose.prod.yml"
if (!(Test-Path $composeFile)) { Write-Host "Missing $composeFile" -ForegroundColor Red; exit 1 }

if (-not $BackupName) {
  $ts = Get-Date -Format "yyyyMMdd-HHmmss"
  $BackupName = "backup-$ts.sql.gz"
}

# Ensure backups volume/path exists on host (named volume will be created by compose)
Write-Host "Creating DB backup: $BackupName" -ForegroundColor Cyan

# Read DB env for the user/db from the .env file, with fallbacks
$envVars = Get-Content $EnvFile | Where-Object { $_ -match "^(POSTGRES_USER|POSTGRES_DB|POSTGRES_PASSWORD)=" } | ForEach-Object {
  $parts = $_.Split("=",2); @{ key=$parts[0]; value=$parts[1] }
}
$pgUser = ($envVars | Where-Object { $_.key -eq 'POSTGRES_USER' }).value
if (-not $pgUser) { $pgUser = 'postgres' }
$pgDb = ($envVars | Where-Object { $_.key -eq 'POSTGRES_DB' }).value
if (-not $pgDb) { $pgDb = 'kiosk' }
$pgPass = ($envVars | Where-Object { $_.key -eq 'POSTGRES_PASSWORD' }).value
if (-not $pgPass) { $pgPass = 'postgres' }

# Run pg_dump via docker compose exec (non-interactive)
$cmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', '-e', "PGPASSWORD=$pgPass", 'db',
  'bash', '-lc',
  "pg_dump -U ${pgUser} ${pgDb} | gzip > /backups/${BackupName}"
)

docker @cmd
if ($LASTEXITCODE -ne 0) { Write-Host "Backup failed" -ForegroundColor Red; exit 1 }
Write-Host "Backup saved to the 'backups' volume as $BackupName" -ForegroundColor Green
