# Restore a Postgres dump from dev backups into the dev db container
param(
  [Parameter(Mandatory=$true)][string]$BackupName,
  [string]$EnvFile = ".env.development.local"
)

$composeFile = "docker-compose.dev.yml"
if (!(Test-Path $composeFile)) { Write-Host "Missing $composeFile" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $EnvFile)) { Write-Host "Missing $EnvFile" -ForegroundColor Red; exit 1 }

# Prefer DATABASE_URL from dev env file; fallback to POSTGRES_* keys.
$raw = Get-Content $EnvFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
$pairs = @{}
foreach ($line in $raw) {
  $parts = $line.Split("=",2)
  $key = $parts[0].Trim()
  $val = $parts[1].Trim().Trim('"').Trim("'")
  $pairs[$key] = $val
}

$pgUser = $null
$pgDb = $null
$pgPass = $null

if ($pairs.ContainsKey("DATABASE_URL") -and -not [string]::IsNullOrWhiteSpace($pairs["DATABASE_URL"])) {
  try {
    $uri = [System.Uri]$pairs["DATABASE_URL"]
    $pgUser = $uri.UserInfo.Split(":",2)[0]
    if ($uri.UserInfo.Contains(":")) { $pgPass = $uri.UserInfo.Split(":",2)[1] }
    $pgDb = $uri.AbsolutePath.Trim("/")
  } catch {}
}

if (-not $pgUser -and $pairs.ContainsKey("POSTGRES_USER")) { $pgUser = $pairs["POSTGRES_USER"] }
if (-not $pgDb -and $pairs.ContainsKey("POSTGRES_DB")) { $pgDb = $pairs["POSTGRES_DB"] }
if (-not $pgPass -and $pairs.ContainsKey("POSTGRES_PASSWORD")) { $pgPass = $pairs["POSTGRES_PASSWORD"] }

if (-not $pgUser) { $pgUser = 'kiosk' }
if (-not $pgDb) { $pgDb = 'pharmacy' }
if (-not $pgPass) { $pgPass = 'secret' }

function Escape-BashSingle([string]$value) {
  return $value -replace "'", '''"''"'''
}

Write-Host "Restoring DEV DB from $BackupName..." -ForegroundColor Cyan
$remotePath = "/backups/$BackupName"
$remotePathEscaped = Escape-BashSingle $remotePath

$checkCmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', 'db',
  'bash', '-lc',
  "test -f '$remotePathEscaped'"
)
docker @checkCmd
if ($LASTEXITCODE -ne 0) { Write-Host "Backup not found in dev_backups: $BackupName" -ForegroundColor Red; exit 1 }

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
if ($LASTEXITCODE -ne 0) { Write-Host "DEV restore failed" -ForegroundColor Red; exit 1 }
Write-Host "DEV restore completed" -ForegroundColor Green
