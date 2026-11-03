[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('backup', 'restore')]
  [string]$Action,

  [string]$BackupFile
)

$ErrorActionPreference = 'Stop'
$containerFile = "/tmp/nextops-$([guid]::NewGuid().ToString('N')).dump"

if ($Action -eq 'backup') {
  $outputDirectory = Join-Path (Get-Location) 'backups'
  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
  $outputFile = Join-Path $outputDirectory "nextops-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"

  docker compose exec -T -e "BACKUP_FILE=$containerFile" postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$BACKUP_FILE"'
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed.' }

  docker compose cp "postgres:$containerFile" $outputFile
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the database backup out of the PostgreSQL container.' }

  docker compose exec -T postgres rm -- $containerFile
  if ($LASTEXITCODE -ne 0) { throw 'Backup was copied but the temporary container file could not be removed.' }

  Write-Output "Backup created: $outputFile"
  return
}

if (-not $BackupFile) { throw 'BackupFile is required for restore.' }
$resolvedBackup = Resolve-Path -LiteralPath $BackupFile -ErrorAction Stop
if (-not $PSCmdlet.ShouldProcess($resolvedBackup.Path, 'Replace the current PostgreSQL database from this backup')) {
  return
}

docker compose cp $resolvedBackup.Path "postgres:$containerFile"
if ($LASTEXITCODE -ne 0) { throw 'Could not copy the backup into the PostgreSQL container.' }

docker compose exec -T -e "BACKUP_FILE=$containerFile" postgres sh -c 'pg_restore --clean --if-exists --no-owner --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$BACKUP_FILE"'
$restoreExitCode = $LASTEXITCODE
docker compose exec -T postgres rm -- $containerFile
if ($LASTEXITCODE -ne 0) { throw 'Restore finished but the temporary container file could not be removed.' }
if ($restoreExitCode -ne 0) { throw 'pg_restore failed. The database may require recovery before serving traffic.' }

Write-Output 'Database restore completed.'
