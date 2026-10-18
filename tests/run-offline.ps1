param(
  [ValidateSet('offline', 'api', 'e2e')]
  [string]$Suite = 'offline'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$playwrightCommand = Join-Path $projectRoot 'node_modules/.bin/playwright.cmd'
$serverUrl = 'http://127.0.0.1:3100'
$dummyDatabaseUrl = 'postgresql://playwright:playwright@127.0.0.1:9/careerforge_test?sslmode=disable'
$serverProcess = $null

if (Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue) {
  throw 'Port 3100 is already in use. Stop only a server you have identified as yours, or configure another loopback port.'
}

New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot 'test-results') | Out-Null
$stdoutLog = Join-Path $projectRoot 'test-results/offline-server.stdout.log'
$stderrLog = Join-Path $projectRoot 'test-results/offline-server.stderr.log'

try {
  $env:DATABASE_URL = $dummyDatabaseUrl
  $env:DIRECT_URL = $dummyDatabaseUrl
  $env:NEON_AUTH_BASE_URL = 'http://127.0.0.1:9/neondb/auth'
  $env:NEON_AUTH_COOKIE_SECRET = 'playwright-only-cookie-secret-not-for-deployment'
  $env:NEXT_PUBLIC_SITE_URL = $serverUrl
  $env:PLAYWRIGHT_BASE_URL = $serverUrl
  $env:GEMINI_API_KEY = 'playwright-offline-placeholder'
  $env:SESSION_SECRET = 'playwright-only-session-secret-not-for-deployment'
  $env:PLAYWRIGHT_EXTERNAL_SERVER = 'true'

  $serverProcess = Start-Process -FilePath $nodePath `
    -ArgumentList @('./node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100') `
    -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog

  $deadline = (Get-Date).AddSeconds(90)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    if ($serverProcess.HasExited) {
      throw "The isolated Next.js server exited before becoming ready. See test-results/offline-server.stderr.log."
    }
    try {
      $response = Invoke-WebRequest -Uri $serverUrl -TimeoutSec 2 -UseBasicParsing
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  if (-not $ready) { throw 'The isolated Next.js server did not become ready within 90 seconds.' }

  $specs = switch ($Suite) {
    'api' { @('tests/api/auth.spec.ts') }
    'e2e' { @('tests/e2e/auth.spec.ts') }
    default { @('tests/api/auth.spec.ts', 'tests/e2e/auth.spec.ts', 'tests/e2e/careerforge-browser.spec.ts') }
  }
  & $playwrightCommand test @specs
  exit $LASTEXITCODE
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    $serverProcess.WaitForExit()
  }
  Remove-Item Env:PLAYWRIGHT_EXTERNAL_SERVER -ErrorAction SilentlyContinue
}
