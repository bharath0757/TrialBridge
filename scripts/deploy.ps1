param([string]$Project = 'trialbridge-in-5443')
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & gcloud run deploy trialbridge-api --source reseacher/backend --project $Project --region us-central1 --allow-unauthenticated --min-instances 0 --max-instances 3 --set-env-vars MONGODB_DATABASE=trialbridge --set-secrets 'MONGODB_URI=trialbridge-mongodb-uri:latest,JWT_SECRET=trialbridge-jwt-secret:latest'
    if ($LASTEXITCODE -ne 0) { throw 'Backend deployment failed. Hosting was not changed.' }
    $apiUrl = (& gcloud run services describe trialbridge-api --project $Project --region us-central1 --format='value(status.url)').Trim()
    if ($LASTEXITCODE -ne 0 -or !$apiUrl.StartsWith('https://')) { throw 'Backend URL could not be resolved.' }
    $health = Invoke-RestMethod -Uri "$apiUrl/api/health" -TimeoutSec 30
    if ($health.status -ne 'ok' -or $health.database_status -ne 'connected') { throw 'Backend is not ready. Hosting was not changed.' }
    $env:VITE_API_URL = '/api'
    $env:VITE_WS_URL = $apiUrl.Replace('https://', 'wss://') + '/api/ws/notifications'
    & firebase deploy --only hosting --project $Project
    if ($LASTEXITCODE -ne 0) { throw 'Hosting deployment failed.' }
    $hostedHealth = Invoke-RestMethod -Uri "https://$Project.web.app/api/health" -TimeoutSec 30
    if ($hostedHealth.status -ne 'ok') { throw 'Hosted API readiness check failed.' }
    Write-Output "Verified hosting and API: https://$Project.web.app"
} finally { Pop-Location }
