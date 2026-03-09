' One-time: creates "Angels Project Manager" shortcut in the Projects folder
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectsDir = fso.GetParentFolderName(appDir)
shortcutPath = fso.BuildPath(projectsDir, "Angels Project Manager.lnk")
Set sc = sh.CreateShortcut(shortcutPath)
sc.TargetPath = fso.BuildPath(appDir, "Angels Project Manager.vbs")
sc.WorkingDirectory = appDir
sc.Description = "Angel's Project Manager"
sc.Save()
WScript.Echo "Shortcut created: Angels Project Manager.lnk"
