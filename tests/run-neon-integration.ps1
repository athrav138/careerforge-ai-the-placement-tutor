param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('deploy', 'test', 'auth', 'auth-diagnostic', 'cleanup', 'recover-cleanup', 'diagnose-signup')]
  [string]$Task
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $projectRoot '.env.integration.local'
$expectedBranchId = 'br-shy-hill-b4dsm90r'
$expectedEndpointId = 'ep-plain-poetry-b4cy32gr'
$productionEndpointId = 'ep-fancy-bread-axzex13s'

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
  throw 'Missing ignored .env.integration.local. Configure only the dedicated Neon integration project; do not copy production credentials.'
}

$loaded = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith('#')) { continue }
  $separator = $line.IndexOf('=')
  if ($separator -lt 1) { throw 'The private integration environment file has an invalid line.' }
  $name = $line.Substring(0, $separator).Trim()
  $value = $line.Substring($separator + 1).Trim()
  if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[$value.Length - 1] -eq '"') -or ($value[0] -eq "'" -and $value[$value.Length - 1] -eq "'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  if ($loaded.ContainsKey($name)) { throw "Duplicate key $name in the private integration environment file." }
  $loaded[$name] = $value
}

$required = @('DATABASE_URL', 'DIRECT_URL', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_COOKIE_SECRET', 'PLAYWRIGHT_TEST_PASSWORD')
$missing = @($required | Where-Object { -not $loaded.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($loaded[$_]) })
if ($missing.Count -gt 0) { throw "The private integration environment is missing required keys: $($missing -join ', ')." }

foreach ($name in $required) { Set-Item -Path "Env:$name" -Value $loaded[$name] }
if ($env:NEON_AUTH_COOKIE_SECRET.Length -lt 32) { throw 'The test-only Auth cookie secret must have at least 32 characters.' }
if ($env:PLAYWRIGHT_TEST_PASSWORD.Length -lt 8) { throw 'The test-only password must have at least 8 characters.' }

$databaseUri = [Uri]$env:DATABASE_URL
$directUri = [Uri]$env:DIRECT_URL
$authUri = [Uri]$env:NEON_AUTH_BASE_URL
$expectedPooledHost = "$expectedEndpointId-pooler.c-6.us-east-2.aws.neon.tech"
$expectedDirectHost = "$expectedEndpointId.c-6.us-east-2.aws.neon.tech"
$expectedAuthHost = "$expectedEndpointId.neonauth.c-6.us-east-2.aws.neon.tech"
if (
  $databaseUri.Host -ne $expectedPooledHost -or
  $directUri.Host -ne $expectedDirectHost -or
  $authUri.Host -ne $expectedAuthHost -or
  $databaseUri.AbsolutePath -ne '/neondb' -or
  $directUri.AbsolutePath -ne '/neondb' -or
  $authUri.AbsolutePath.TrimEnd('/') -ne '/neondb/auth' -or
  $databaseUri.AbsoluteUri.Contains($productionEndpointId) -or
  $directUri.AbsoluteUri.Contains($productionEndpointId) -or
  $authUri.AbsoluteUri.Contains($productionEndpointId)
) {
  throw 'Refusing integration operation: the configured database/Auth URLs do not identify the approved isolated project.'
}

$env:PLAYWRIGHT_TEST_BRANCH_ID = $expectedBranchId
$env:PLAYWRIGHT_TEST_DATABASE_URL = $env:DATABASE_URL
$env:PLAYWRIGHT_TEST_DIRECT_URL = $env:DIRECT_URL
$env:PLAYWRIGHT_TEST_NEON_AUTH_BASE_URL = $env:NEON_AUTH_BASE_URL
$env:PLAYWRIGHT_AUTH_INTEGRATION = 'true'
$env:PLAYWRIGHT_DATABASE_INTEGRATION = 'true'
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3100'
$env:NEXT_PUBLIC_SITE_URL = $env:PLAYWRIGHT_BASE_URL
$env:GEMINI_API_KEY = 'integration-test-placeholder'
$env:SESSION_SECRET = 'integration-test-placeholder-session-secret'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
$env:PLAYWRIGHT_EXTERNAL_SERVER = 'false'

Push-Location $projectRoot
try {
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $prisma = Join-Path $projectRoot 'node_modules/.bin/prisma.cmd'
  $playwright = Join-Path $projectRoot 'node_modules/.bin/playwright.cmd'

  if ($Task -eq 'cleanup') {
    $cleanupFile = Join-Path $projectRoot 'test-results/neon-auth-cleanup.json'
    if (-not (Test-Path -LiteralPath $cleanupFile -PathType Leaf)) {
      throw 'No per-run synthetic identity cleanup list exists.'
    }
    & $node 'tests/integration/cleanup-synthetic-users.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Synthetic identity cleanup failed; the exact cleanup list was retained.' }
    & $node 'tests/integration/verify-target.mjs' after-test
    if ($LASTEXITCODE -ne 0) { throw 'Post-cleanup target verification failed.' }
    return
  }

  if ($Task -eq 'recover-cleanup') {
    & $node 'tests/integration/recover-synthetic-cleanup.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Recovery refused or failed; no cleanup was attempted.' }
    & $node 'tests/integration/cleanup-synthetic-users.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Recovered synthetic identity cleanup failed.' }
    & $node 'tests/integration/verify-target.mjs' after-test
    if ($LASTEXITCODE -ne 0) { throw 'Recovered target did not pass post-cleanup verification.' }
    return
  }

  if ($Task -eq 'diagnose-signup') {
    & $node 'tests/integration/verify-target.mjs' before
    if ($LASTEXITCODE -ne 0) { throw 'Pre-diagnostic identity check failed.' }
    & $node 'tests/integration/diagnose-signup.mjs'
    $diagnosticExit = $LASTEXITCODE
    $cleanupFile = Join-Path $projectRoot 'test-results/neon-auth-cleanup.json'
    $cleanupExit = 0
    if (Test-Path -LiteralPath $cleanupFile) {
      & $node 'tests/integration/cleanup-synthetic-users.mjs'
      $cleanupExit = $LASTEXITCODE
    }
    & $node 'tests/integration/verify-target.mjs' after-test
    $verifyExit = $LASTEXITCODE
    if ($cleanupExit -ne 0) { throw 'Diagnostic identity cleanup failed; inspect the retained exact cleanup list.' }
    if ($verifyExit -ne 0) { throw 'The target did not pass post-diagnostic cleanup verification.' }
    if ($diagnosticExit -ne 0) { throw 'The minimal Auth diagnostic did not complete.' }
    return
  }

  & $node 'tests/integration/verify-target.mjs' before
  if ($LASTEXITCODE -ne 0) { throw 'Pre-migration identity check failed; Prisma was not started.' }

  if ($Task -eq 'deploy') {
    & $prisma validate
    if ($LASTEXITCODE -ne 0) { throw 'Prisma schema validation failed; no migration was started.' }
    & $prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { throw 'Prisma migrate deploy failed on the isolated integration project.' }
    & $prisma migrate status
    if ($LASTEXITCODE -ne 0) { throw 'Prisma migration status did not report a clean deployment.' }
    & $node 'tests/integration/verify-target.mjs' migrated
    if ($LASTEXITCODE -ne 0) { throw 'Migration history or checksum verification failed.' }
    return
  }

  & $node 'tests/integration/verify-target.mjs' migrated
  if ($LASTEXITCODE -ne 0) { throw 'The target does not have the complete checked-in migration history.' }
  $cleanupFile = Join-Path $projectRoot 'test-results/neon-auth-cleanup.json'
  if (Test-Path -LiteralPath $cleanupFile) { Remove-Item -LiteralPath $cleanupFile -Force }
  if ($Task -eq 'auth' -or $Task -eq 'auth-diagnostic') {
    $port3101Listener = Get-NetTCPConnection -LocalPort 3101 -State Listen -ErrorAction SilentlyContinue
    if ($port3101Listener) { throw 'Port 3101 is already in use. Stop only a server you have identified, or choose a reviewed alternate port before running integration tests.' }
    $env:PLAYWRIGHT_BASE_URL = 'http://localhost:3101'
    $env:NEXT_PUBLIC_SITE_URL = $env:PLAYWRIGHT_BASE_URL
  }
  if ($Task -eq 'auth-diagnostic') {
    $env:PLAYWRIGHT_AUTH_DIAGNOSTIC = 'true'
    & $playwright test 'tests/integration/neon-auth.spec.ts' --grep 'disposable account can register'
  } elseif ($Task -eq 'auth') {
    & $playwright test 'tests/integration/neon-auth.spec.ts'
  } else {
    & $playwright test 'tests/integration/neon-auth.spec.ts' 'tests/db/persistence-and-security.spec.ts' 'tests/api/neon-auth-and-security.spec.ts'
  }
  $testExit = $LASTEXITCODE
  $cleanupExit = 0
  if (Test-Path -LiteralPath $cleanupFile) {
    & $node 'tests/integration/cleanup-synthetic-users.mjs'
    $cleanupExit = $LASTEXITCODE
  }
  & $node 'tests/integration/verify-target.mjs' after-test
  $verifyExit = $LASTEXITCODE
  if ($testExit -ne 0) { throw "Integration tests failed with exit code $testExit." }
  if ($cleanupExit -ne 0) { throw 'Synthetic account cleanup verification failed.' }
  if ($verifyExit -ne 0) { throw 'The isolated target did not pass post-test cleanup verification.' }
} finally {
  Pop-Location
}
