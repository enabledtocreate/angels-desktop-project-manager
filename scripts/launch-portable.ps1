param(
  [Parameter(Mandatory = $true)]
  [string] $PortableExePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $PortableExePath)) {
  throw "Portable executable not found: $PortableExePath"
}

Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

$workingDirectory = Split-Path -Parent $PortableExePath
Start-Process -FilePath $PortableExePath -WorkingDirectory $workingDirectory
