# Updates "Angels Project Manager.lnk" to use public/icon.ico.
# Run from project root: .\scripts\update-shortcut-icon.ps1
# Or pass the .lnk path: .\scripts\update-shortcut-icon.ps1 "C:\Users\You\Desktop\Angels Project Manager.lnk"

param(
  [string] $ShortcutPath = $null
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$IconIco = Join-Path $ProjectRoot "public\icon.ico"

if (-not (Test-Path $IconIco)) {
  Write-Error "public/icon.ico not found. Run: npm run ensure-icon-ico"
  exit 1
}

if (-not $ShortcutPath) {
  $ShortcutPath = Join-Path $ProjectRoot "Angels Project Manager.lnk"
}

$Shell = New-Object -ComObject WScript.Shell
if (Test-Path $ShortcutPath) {
  $Shortcut = $Shell.CreateShortcut($ShortcutPath)
  $Shortcut.IconLocation = "$IconIco,0"
  $Shortcut.Save()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Shell) | Out-Null
  Write-Host "Updated shortcut icon: $ShortcutPath"
} else {
  $Shortcut = $Shell.CreateShortcut($ShortcutPath)
  $Shortcut.TargetPath = "cmd.exe"
  $Shortcut.Arguments = "/c npm start"
  $Shortcut.WorkingDirectory = $ProjectRoot
  $Shortcut.IconLocation = "$IconIco,0"
  $Shortcut.Save()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($Shell) | Out-Null
  Write-Host "Created shortcut with icon: $ShortcutPath"
}
