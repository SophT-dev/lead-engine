Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class W { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n); }'
$p = Get-Process chrome | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -First 1
[W]::ShowWindow($p.MainWindowHandle, 3)
[W]::SetForegroundWindow($p.MainWindowHandle)
Start-Sleep -Milliseconds 2000
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$s = [System.Windows.Forms.Screen]::AllScreens[1]
$b = New-Object System.Drawing.Bitmap($s.Bounds.Width, $s.Bounds.Height)
$g = [System.Drawing.Graphics]::FromImage($b)
$g.CopyFromScreen($s.Bounds.Location, [System.Drawing.Point]::Empty, $s.Bounds.Size)
$b.Save('C:\Users\sophi\Downloads\SOPH VS Code\lead-engine\output\john-mumo-2026-03-13\screenshot.png')
$g.Dispose()
$b.Dispose()
Write-Output 'saved'
