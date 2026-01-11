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
function Escape-BashSingle([string]$value) {
  return $value -replace "'", '''"''"'''
}

Write-Host "Restoring DB from $BackupName..." -ForegroundColor Cyan
$remotePath = "/backups/$BackupName"
$remotePathEscaped = Escape-BashSingle $remotePath

$checkCmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', 'db',
  'bash', '-lc',
  "test -f '$remotePathEscaped'"
)
docker @checkCmd
if ($LASTEXITCODE -ne 0) { Write-Host "Backup not found: $BackupName" -ForegroundColor Red; exit 1 }

$dropCmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', '-e', "PGPASSWORD=$pgPass", 'db',
  'psql', '-U', $pgUser, $pgDb, '-v', 'ON_ERROR_STOP=1',
  '-c', 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'
)
docker @dropCmd
if ($LASTEXITCODE -ne 0) { Write-Host "Pre-restore cleanup failed" -ForegroundColor Red; exit 1 }

if ($BackupName -match '\.gz$') {
  $restoreCmd = "gunzip -c '$remotePathEscaped' | psql -U ${pgUser} ${pgDb}"
}
else {
  $restoreCmd = "psql -U ${pgUser} ${pgDb} < '$remotePathEscaped'"
}
$cmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', '-e', "PGPASSWORD=$pgPass", 'db',
  'bash', '-lc',
  $restoreCmd
)

docker @cmd
if ($LASTEXITCODE -ne 0) { Write-Host "Restore failed" -ForegroundColor Red; exit 1 }
Write-Host "Restore completed" -ForegroundColor Green
