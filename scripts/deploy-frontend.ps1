param(
    [string]$Project = 'trialbridge-in-5443',
    [string]$ApiUrl = 'https://trialbridge-api-lrbt.onrender.com/api'
)
$ErrorActionPreference = 'Stop'
if ($ApiUrl -ne '/api' -and $ApiUrl -notmatch '^https://[^/]+(/[^/]+)*/api/?$') {
    throw 'ApiUrl must be /api or the HTTPS backend URL ending in /api.'
}
$previousApiUrl = $env:VITE_API_URL
$previousWsUrl = $env:VITE_WS_URL
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $env:VITE_API_URL = $ApiUrl.TrimEnd('/')
    Remove-Item Env:VITE_WS_URL -ErrorAction SilentlyContinue
    & firebase deploy --only hosting --project $Project --config firebase.frontend.json
    if ($LASTEXITCODE -ne 0) { throw 'Frontend deployment failed.' }
    Write-Output "Frontend published: https://$Project.web.app"
    if ($ApiUrl -eq '/api') {
        Write-Output 'Backend is pending. After Cloud Run is ready, run ./scripts/deploy.ps1 to enable API routing.'
    }
} finally {
    $env:VITE_API_URL = $previousApiUrl
    $env:VITE_WS_URL = $previousWsUrl
    Pop-Location
}
