param(
    [ValidateSet("local", "dev", "prod", "enterprise", "enterprise-dev")]
    [string]$Flavor = "local"
)

$ErrorActionPreference = "Stop"

$Identifier = switch ($Flavor) {
    "local"          { "com.ryoikitenkai.desktop.local" }
    "dev"            { "com.ryoikitenkai.desktop.dev" }
    "prod"           { "com.ryoikitenkai.desktop" }
    "enterprise"     { "com.ryoikitenkai.desktop.enterprise" }
    "enterprise-dev" { "com.ryoikitenkai.desktop.enterprise-dev" }
}

$DbFilename = "ryoiki-tenkai.db"
$ConfigDir = Join-Path $env:APPDATA $Identifier
$DbPath = Join-Path $ConfigDir $DbFilename

$Removed = $false

foreach ($Suffix in "", "-wal", "-shm") {
    $Target = "$DbPath$Suffix"
    if (Test-Path $Target) {
        Remove-Item $Target -Force
        Write-Host "Removed $Target"
        $Removed = $true
    }
}

if (-not $Removed) {
    Write-Host "No database files found under $ConfigDir"
} else {
    Write-Host "Ryōiki Tenkai desktop SQLite data cleared."
}
