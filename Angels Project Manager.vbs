' Launches the batch file in a hidden console window (no console visible)
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(appDir, "Angels Project Manager.bat")
sh.Run "cmd /c call """ & batPath & """ hidden", 0, False
