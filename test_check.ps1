param(
	[string]$BaseUrl = 'http://localhost:3001'
)

$ErrorActionPreference = 'Stop'

$pass = 0
$fail = 0

function Write-Pass([string]$msg) {
	$script:pass++
	Write-Host "[PASS] $msg" -ForegroundColor Green
}

function Write-Fail([string]$msg) {
	$script:fail++
	Write-Host "[FAIL] $msg" -ForegroundColor Red
}

function Test-Header([string]$Name, [string]$Contains) {
	try {
		$resp = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -Method GET
		$headerValue = $resp.Headers[$Name]

		if ([string]::IsNullOrWhiteSpace($headerValue)) {
			Write-Fail "Header $Name missing"
			return
		}

		if (-not [string]::IsNullOrWhiteSpace($Contains) -and ($headerValue -notlike "*$Contains*")) {
			Write-Fail "Header $Name value mismatch. Got: $headerValue"
			return
		}

		Write-Pass "Header $Name is present"
	}
	catch {
		Write-Fail "Header check failed for $Name. $($_.Exception.Message)"
	}
}

function Invoke-RateBurst {
	param(
		[string]$Path,
		[string]$Method,
		[int]$Requests,
		[string]$Body = '',
		[string]$ContentType = 'application/json'
	)

	$hit429 = $false
	$retryAfterValue = $null

	for ($i = 1; $i -le $Requests; $i++) {
		try {
			if ($Method -eq 'GET') {
				$resp = Invoke-WebRequest -Uri "$BaseUrl$Path" -UseBasicParsing -Method GET
			}
			else {
				$resp = Invoke-WebRequest -Uri "$BaseUrl$Path" -UseBasicParsing -Method $Method -Body $Body -ContentType $ContentType
			}

			if ($resp.StatusCode -eq 429) {
				$hit429 = $true
				$retryAfterValue = $resp.Headers['Retry-After']
				break
			}
		}
		catch {
			$ex = $_.Exception
			$statusCode = $null

			if ($ex.Response) {
				try { $statusCode = [int]$ex.Response.StatusCode } catch {}
				try { $retryAfterValue = $ex.Response.Headers['Retry-After'] } catch {}
			}

			if ($statusCode -eq 429) {
				$hit429 = $true
				break
			}
		}
	}

	if (-not $hit429) {
		Write-Fail "Rate limit not triggered on $Path after $Requests requests"
		return
	}

	if ([string]::IsNullOrWhiteSpace($retryAfterValue)) {
		Write-Pass "Rate limit triggered on $Path"
	}
	else {
		Write-Pass "Rate limit triggered on $Path with Retry-After=$retryAfterValue"
	}
}

Write-Host '=== Manajel Security Manual Check ===' -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"

# 1) Basic website check
try {
  $homeResp = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -Method GET
  if ($homeResp.StatusCode -ge 200 -and $homeResp.StatusCode -lt 400) {
    Write-Pass 'Home page is loading'
  }
  else {
    Write-Fail "Home page returned status $($homeResp.StatusCode)"
catch {
	Write-Fail "Home page request failed. $($_.Exception.Message)"
}

# 2) Security headers check
Test-Header -Name 'Content-Security-Policy' -Contains 'default-src'
Test-Header -Name 'X-Content-Type-Options' -Contains 'nosniff'
Test-Header -Name 'X-Frame-Options' -Contains 'DENY'
Test-Header -Name 'Referrer-Policy' -Contains 'strict-origin-when-cross-origin'
Test-Header -Name 'Permissions-Policy' -Contains 'camera='

# 3) Rate limit check
Write-Host "`nTesting rate limits (expected to hit 429)..." -ForegroundColor Yellow

# /api/auth/* limit = 20/min
Invoke-RateBurst -Path '/api/auth/session' -Method 'GET' -Requests 30

# /api/contact/* limit = 20/min
$contactBody = '{"name":"Security Test","email":"test@example.com","subject":"RateLimit","message":"Rate test"}'
Invoke-RateBurst -Path '/api/contact' -Method 'POST' -Requests 30 -Body $contactBody

# /api/orders/* limit = 60/min
$orderBody = '{"items":[]}'
Invoke-RateBurst -Path '/api/orders' -Method 'POST' -Requests 70 -Body $orderBody

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $pass" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor Red

if ($fail -gt 0) {
	exit 1
}

exit 0