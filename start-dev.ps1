$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendCommand = "Set-Location '$projectRoot'; npm run backend:dev"
$frontendCommand = "Set-Location '$projectRoot'; npm run dev"

Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-Command', $backendCommand -WorkingDirectory $projectRoot
Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-Command', $frontendCommand -WorkingDirectory $projectRoot

Write-Host "Started backend and frontend from $projectRoot"
Write-Host "Open http://localhost:8080"
