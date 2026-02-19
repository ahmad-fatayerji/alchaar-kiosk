# Create a timestamped Postgres dump in the dev db container into /backups
param(
  [string]$EnvFile = ".env.development.local",
  [string]$BackupName
)

$composeFile = "docker-compose.dev.yml"
if (!(Test-Path $composeFile)) { Write-Host "Missing $composeFile" -ForegroundColor Red; exit 1 }

if (-not $BackupName) {
  $ts = Get-Date -Format "yyyyMMdd-HHmmss"
  $BackupName = "backup-dev-$ts.sql.gz"
}

Write-Host "Creating DEV DB backup: $BackupName" -ForegroundColor Cyan

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

$cmd = @(
  'compose', '--env-file', $EnvFile, '-f', $composeFile,
  'exec', '-T', '-e', "PGPASSWORD=$pgPass", 'db',
  'bash', '-lc',
  "set -euo pipefail; mkdir -p /backups; pg_dump -U ${pgUser} ${pgDb} | gzip > /backups/${BackupName}"
)

docker @cmd
if ($LASTEXITCODE -ne 0) { Write-Host "DEV backup failed" -ForegroundColor Red; exit 1 }
Write-Host "DEV backup saved to the 'dev_backups' volume as $BackupName" -ForegroundColor Green
