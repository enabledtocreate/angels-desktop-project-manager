param(
  [string] $PortableExePath = $null
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $ProjectRoot "dist"

if (-not (Test-Path $DistDir)) {
  Write-Host "dist folder not found; skipping shortcut creation."
  exit 0
}

if (-not $PortableExePath) {
  $PortableExePath = Get-ChildItem -Path $DistDir -Filter "*-portable.exe" -File |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1 |
    ForEach-Object { $_.FullName }
}

if (-not $PortableExePath -or -not (Test-Path $PortableExePath)) {
  Write-Host "Portable build artifact not found; skipping shortcut creation."
  exit 0
}

$ShortcutName = "Angel's Project Manager.lnk"
$DesktopDir = [Environment]::GetFolderPath("DesktopDirectory")
$GrandparentDir = Split-Path (Split-Path $DistDir -Parent) -Parent
$LauncherScript = Join-Path $ScriptDir "launch-portable.ps1"
$Targets = @(
  (Join-Path $DesktopDir $ShortcutName),
  (Join-Path $GrandparentDir $ShortcutName)
)

$Shell = New-Object -ComObject WScript.Shell
try {
  foreach ($ShortcutPath in $Targets) {
    $Shortcut = $Shell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "$PSHOME\powershell.exe"
    $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$LauncherScript`" -PortableExePath `"$PortableExePath`""
    $Shortcut.WorkingDirectory = $ProjectRoot
    $Shortcut.IconLocation = "$PortableExePath,0"
    $Shortcut.Save()
    Write-Host "Created shortcut: $ShortcutPath"
  }
} finally {
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Shell) | Out-Null
}
