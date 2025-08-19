# Restore a Postgres dump from backups into the db container
param(
  [Parameter(Mandatory=$true)][string]$BackupName,
  [string]$EnvFile = ".env"
)

$composeFile = "docker-compose.prod.yml"
if (!(Test-Path $composeFile)) { Write-Host "Missing $composeFile" -ForegroundColor Red; exit 1 }

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

Write-Host "Restoring DB from $BackupName..." -ForegroundColor Cyan
$env:PGPASSWORD = $pgPass
$cmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', 'db',
  'bash', '-lc',
  "if [ -f /backups/${BackupName} ]; then gunzip -c /backups/${BackupName} | psql -U ${pgUser} ${pgDb}; else psql -U ${pgUser} ${pgDb} < /backups/${BackupName}; fi"
)

docker @cmd
if ($LASTEXITCODE -ne 0) { Write-Host "Restore failed" -ForegroundColor Red; exit 1 }
Write-Host "Restore completed" -ForegroundColor Green
