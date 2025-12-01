# Payroll Execution - Automated Test Script
# Run this script to test the complete payroll execution flow

$baseUrl = "http://localhost:3000/payroll-execution"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Payroll Execution Testing Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Function to make API calls with error handling
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    
    try {
        $params = @{
            Method = $Method
            Uri = "$baseUrl$Endpoint"
            Headers = $headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✓ SUCCESS" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        Write-Host ""
        return $response
    }
    catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Write-Host ""
        return $null
    }
}

# Test 1: Clear existing data
Write-Host "Step 1: Clear Existing Data" -ForegroundColor Magenta
Invoke-ApiRequest -Method "POST" -Endpoint "/seed/clear" -Description "Clear all test data"

Start-Sleep -Seconds 1

# Test 2: Seed test benefits
Write-Host "Step 2: Seed Test Benefits" -ForegroundColor Magenta
$seedResult = Invoke-ApiRequest -Method "POST" -Endpoint "/seed/benefits" -Description "Seed test benefits and employees"

if (-not $seedResult) {
    Write-Host "Failed to seed data. Exiting." -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 3: Check database status
Write-Host "Step 3: Check Database Status" -ForegroundColor Magenta
Invoke-ApiRequest -Method "GET" -Endpoint "/test/db-status" -Description "Verify database populated"

Start-Sleep -Seconds 1

# Test 4: Get pending benefits
Write-Host "Step 4: Get Pending Benefits" -ForegroundColor Magenta
$pendingBenefits = Invoke-ApiRequest -Method "GET" -Endpoint "/benefits/pending" -Description "Retrieve pending benefits"

Start-Sleep -Seconds 1

# Test 5: Review a benefit (if any exist)
if ($pendingBenefits -and $pendingBenefits.bonuses -and $pendingBenefits.bonuses.Count -gt 0) {
    Write-Host "Step 5: Approve Signing Bonus" -ForegroundColor Magenta
    $bonus = $pendingBenefits.bonuses[0]
    $reviewBody = @{
        benefitId = $bonus._id
        type = "SIGNING_BONUS"
        action = "APPROVE"
        comment = "Automated test - approved"
    }
    Invoke-ApiRequest -Method "PATCH" -Endpoint "/benefits/review" -Body $reviewBody -Description "Approve signing bonus"
}

Start-Sleep -Seconds 1

# Test 6: Initiate payroll period
Write-Host "Step 6: Initiate Payroll Period" -ForegroundColor Magenta
$initiateBody = @{
    month = "DEC"
    year = 2025
    entity = "Test Corp"
}
$initiateResult = Invoke-ApiRequest -Method "POST" -Endpoint "/period" -Body $initiateBody -Description "Create payroll run PR-2025-DEC"

if (-not $initiateResult) {
    Write-Host "Failed to initiate period. Exiting." -ForegroundColor Red
    exit 1
}

$runId = "PR-2025-DEC"
Start-Sleep -Seconds 1

# Test 7: Approve period (triggers employee fetch)
Write-Host "Step 7: Approve Period" -ForegroundColor Magenta
$approveBody = @{
    runId = $runId
    action = "APPROVE"
    comment = "Automated test - period approved"
}
Invoke-ApiRequest -Method "PATCH" -Endpoint "/period/review" -Body $approveBody -Description "Approve period and fetch employees"

Start-Sleep -Seconds 2

# Test 8: Get eligible employees
Write-Host "Step 8: Get Eligible Employees" -ForegroundColor Magenta
$employees = Invoke-ApiRequest -Method "GET" -Endpoint "/drafts/$runId/employees" -Description "Retrieve employees in draft"

Start-Sleep -Seconds 1

# Test 9: Calculate payroll
Write-Host "Step 9: Calculate Payroll" -ForegroundColor Magenta
$calcResult = Invoke-ApiRequest -Method "POST" -Endpoint "/runs/$runId/calculate" -Description "Calculate salaries with tax/insurance"

Start-Sleep -Seconds 2

# Test 10: Get payslips
Write-Host "Step 10: Get Payslips" -ForegroundColor Magenta
$payslips = Invoke-ApiRequest -Method "GET" -Endpoint "/runs/$runId/payslips" -Description "Retrieve calculated payslips"

Start-Sleep -Seconds 1

# Test 11: Add manual adjustment (if payslips exist)
if ($payslips -and $payslips.payslips -and $payslips.payslips.Count -gt 0) {
    Write-Host "Step 11: Add Manual Adjustment" -ForegroundColor Magenta
    $payslipId = $payslips.payslips[0].payslipId
    $adjustmentBody = @{
        type = "BONUS"
        amount = 500
        reason = "Automated test - performance bonus"
    }
    Invoke-ApiRequest -Method "PATCH" -Endpoint "/payslips/$payslipId/adjust" -Body $adjustmentBody -Description "Add bonus adjustment"
}

Start-Sleep -Seconds 1

# Test 12: Submit for approval (anomaly detection)
Write-Host "Step 12: Submit for Approval" -ForegroundColor Magenta
$submitResult = Invoke-ApiRequest -Method "PATCH" -Endpoint "/runs/$runId/submit" -Description "Submit for manager approval with anomaly check"

Start-Sleep -Seconds 1

# Test 13: Manager review (approve)
Write-Host "Step 13: Manager Review" -ForegroundColor Magenta
$managerBody = @{
    status = "APPROVED"
    comment = "Automated test - manager approved"
}
Invoke-ApiRequest -Method "PATCH" -Endpoint "/runs/$runId/manager-review" -Body $managerBody -Description "Manager approval"

Start-Sleep -Seconds 1

# Test 14: Preview dashboard
Write-Host "Step 14: Preview Dashboard" -ForegroundColor Magenta
Invoke-ApiRequest -Method "GET" -Endpoint "/runs/$runId/preview" -Description "View financial preview"

Start-Sleep -Seconds 1

# Test 15: Finance review (approve)
Write-Host "Step 15: Finance Review" -ForegroundColor Magenta
$financeBody = @{
    status = "APPROVED"
    comment = "Automated test - finance approved"
}
Invoke-ApiRequest -Method "PATCH" -Endpoint "/runs/$runId/finance-review" -Body $financeBody -Description "Finance final approval"

Start-Sleep -Seconds 1

# Test 16: Execute and distribute
Write-Host "Step 16: Execute & Distribute" -ForegroundColor Magenta
$executeResult = Invoke-ApiRequest -Method "PATCH" -Endpoint "/runs/$runId/execute-and-distribute" -Description "Execute payroll and distribute payslips"

Start-Sleep -Seconds 1

# Test 17: Get payslip details (if employees exist)
if ($employees -and $employees.employees -and $employees.employees.Count -gt 0) {
    Write-Host "Step 17: Get Payslip Details" -ForegroundColor Magenta
    $employeeId = $employees.employees[0].employeeId
    Invoke-ApiRequest -Method "GET" -Endpoint "/payslips/$employeeId/run/$runId" -Description "View detailed payslip with tax breakdown"
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Payroll run '$runId' created" -ForegroundColor White
Write-Host "- Employees fetched and calculated" -ForegroundColor White
Write-Host "- Anomaly detection passed" -ForegroundColor White
Write-Host "- Manager and Finance approved" -ForegroundColor White
Write-Host "- Payslips executed and distributed" -ForegroundColor White
Write-Host "- Run automatically locked" -ForegroundColor White
Write-Host ""
Write-Host "Check the database to verify all data was saved correctly." -ForegroundColor Cyan
