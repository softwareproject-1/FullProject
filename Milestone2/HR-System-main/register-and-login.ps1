# Register All Users and Get JWT Tokens
# This script registers users for all roles and collects their JWT tokens

$baseUrl = "http://localhost:3000/auth"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Authentication & Token Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define users for each role
$users = @(
    @{
        firstName = "Sarah"
        middleName = "Jane"
        lastName = "Specialist"
        nationalId = "10000000000001"
        password = "specialist123"
        personalEmail = "sarah.specialist@personal.com"
        mobilePhone = "+201000000001"
        employeeNumber = "EMP-PS-001"
        dateOfHire = "2024-01-15"
        workEmail = "sarah.specialist@company.com"
        role = "Payroll Specialist"
    },
    @{
        firstName = "Michael"
        middleName = "James"
        lastName = "Manager"
        nationalId = "10000000000002"
        password = "manager123"
        personalEmail = "michael.manager@personal.com"
        mobilePhone = "+201000000002"
        employeeNumber = "EMP-PM-001"
        dateOfHire = "2024-01-15"
        workEmail = "michael.manager@company.com"
        role = "Payroll Manager"
    },
    @{
        firstName = "Emily"
        middleName = "Rose"
        lastName = "Finance"
        nationalId = "10000000000003"
        password = "finance123"
        personalEmail = "emily.finance@personal.com"
        mobilePhone = "+201000000003"
        employeeNumber = "EMP-FIN-001"
        dateOfHire = "2024-01-15"
        workEmail = "emily.finance@company.com"
        role = "Finance Staff"
    },
    @{
        firstName = "Robert"
        middleName = "William"
        lastName = "HRManager"
        nationalId = "10000000000004"
        password = "hrmanager123"
        personalEmail = "robert.hr@personal.com"
        mobilePhone = "+201000000004"
        employeeNumber = "EMP-HRM-001"
        dateOfHire = "2024-01-15"
        workEmail = "robert.hr@company.com"
        role = "HR Manager"
    },
    @{
        firstName = "Jennifer"
        middleName = "Anne"
        lastName = "HREmployee"
        nationalId = "10000000000005"
        password = "hremp123"
        personalEmail = "jennifer.hr@personal.com"
        mobilePhone = "+201000000005"
        employeeNumber = "EMP-HRE-001"
        dateOfHire = "2024-01-15"
        workEmail = "jennifer.hr@company.com"
        role = "HR Employee"
    },
    @{
        firstName = "David"
        middleName = "John"
        lastName = "HRAdmin"
        nationalId = "10000000000006"
        password = "hradmin123"
        personalEmail = "david.admin@personal.com"
        mobilePhone = "+201000000006"
        employeeNumber = "EMP-HRA-001"
        dateOfHire = "2024-01-15"
        workEmail = "david.admin@company.com"
        role = "HR Admin"
    },
    @{
        firstName = "Admin"
        middleName = "System"
        lastName = "Root"
        nationalId = "10000000000007"
        password = "admin123"
        personalEmail = "admin@personal.com"
        mobilePhone = "+201000000007"
        employeeNumber = "EMP-ADM-001"
        dateOfHire = "2024-01-15"
        workEmail = "admin@company.com"
        role = "System Admin"
    },
    @{
        firstName = "James"
        middleName = "Robert"
        lastName = "DeptHead"
        nationalId = "10000000000008"
        password = "depthead123"
        personalEmail = "james.head@personal.com"
        mobilePhone = "+201000000008"
        employeeNumber = "EMP-DH-001"
        dateOfHire = "2024-01-15"
        workEmail = "james.head@company.com"
        role = "Department Head"
    },
    @{
        firstName = "Lisa"
        middleName = "Marie"
        lastName = "Employee"
        nationalId = "10000000000009"
        password = "employee123"
        personalEmail = "lisa.emp@personal.com"
        mobilePhone = "+201000000009"
        employeeNumber = "EMP-DE-001"
        dateOfHire = "2024-01-15"
        workEmail = "lisa.emp@company.com"
        role = "Department Employee"
    }
)

Write-Host "Step 1: Registering Users..." -ForegroundColor Magenta
Write-Host ""

$registeredUsers = @()

foreach ($user in $users) {
    Write-Host "Registering: $($user.role) - $($user.firstName) $($user.lastName)" -ForegroundColor Yellow
    
    # Create registration body (exclude 'role' field as it's not in DTO)
    $registrationBody = @{
        firstName = $user.firstName
        middleName = $user.middleName
        lastName = $user.lastName
        nationalId = $user.nationalId
        password = $user.password
        personalEmail = $user.personalEmail
        mobilePhone = $user.mobilePhone
        employeeNumber = $user.employeeNumber
        dateOfHire = $user.dateOfHire
        workEmail = $user.workEmail
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Method POST -Uri "$baseUrl/register" -Body $registrationBody -Headers $headers
        Write-Host "✓ Registration successful" -ForegroundColor Green
        $registeredUsers += $user
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "⚠ User already exists (skipping)" -ForegroundColor Yellow
            $registeredUsers += $user
        }
        else {
            Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Step 2: Logging in and collecting JWT tokens..." -ForegroundColor Magenta
Write-Host ""

$tokens = @{}
$tokenList = @()

foreach ($user in $registeredUsers) {
    Write-Host "Logging in: $($user.role)" -ForegroundColor Yellow
    
    $loginBody = @{
        workEmail = $user.workEmail
        password = $user.password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Method POST -Uri "$baseUrl/login" -Body $loginBody -Headers $headers
        
        # Extract token from response
        $token = $response.user.access_token
        
        if ($token) {
            $tokens[$user.role] = $token
            $tokenList += @{
                role = $user.role
                email = $user.workEmail
                token = $token
                userId = $response.user.userId
            }
            
            Write-Host "✓ Login successful" -ForegroundColor Green
            Write-Host "  User ID: $($response.user.userId)" -ForegroundColor Gray
            Write-Host "  Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
        }
        else {
            Write-Host "✗ No token in response" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Token Collection Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display summary
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total users registered: $($registeredUsers.Count)" -ForegroundColor White
Write-Host "  Tokens collected: $($tokens.Count)" -ForegroundColor White
Write-Host ""

# Display tokens for easy copy-paste
Write-Host "JWT Tokens:" -ForegroundColor Cyan
Write-Host ""

foreach ($item in $tokenList) {
    Write-Host "$($item.role):" -ForegroundColor Yellow
    Write-Host "  Email: $($item.email)" -ForegroundColor Gray
    Write-Host "  Token: $($item.token)" -ForegroundColor White
    Write-Host ""
}

# Save to JSON file
$outputFile = "jwt-tokens.json"
$tokenData = @{
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    tokens = $tokenList
    environment = @{
        SPECIALIST_TOKEN = $tokens["Payroll Specialist"]
        MANAGER_TOKEN = $tokens["Payroll Manager"]
        FINANCE_TOKEN = $tokens["Finance Staff"]
        HR_MANAGER_TOKEN = $tokens["HR Manager"]
        ADMIN_TOKEN = $tokens["System Admin"]
        HR_EMPLOYEE_TOKEN = $tokens["HR Employee"]
        HR_ADMIN_TOKEN = $tokens["HR Admin"]
        DEPT_HEAD_TOKEN = $tokens["Department Head"]
        EMPLOYEE_TOKEN = $tokens["Department Employee"]
    }
}

$tokenData | ConvertTo-Json -Depth 5 | Out-File $outputFile
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tokens saved to: $outputFile" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create Thunder Client environment file
$thunderEnvFile = "thunder-tests/thunderclient-env.json"
$thunderEnv = @{
    client = "Thunder Client"
    collectionName = "Payroll Execution Environment"
    dateExported = (Get-Date).ToString("yyyy-MM-dd")
    version = "1.1"
    variables = @(
        @{ name = "BASE_URL"; value = "http://localhost:3000" },
        @{ name = "SPECIALIST_TOKEN"; value = $tokens["Payroll Specialist"] },
        @{ name = "MANAGER_TOKEN"; value = $tokens["Payroll Manager"] },
        @{ name = "FINANCE_TOKEN"; value = $tokens["Finance Staff"] },
        @{ name = "HR_MANAGER_TOKEN"; value = $tokens["HR Manager"] },
        @{ name = "ADMIN_TOKEN"; value = $tokens["System Admin"] },
        @{ name = "EMPLOYEE_TOKEN"; value = $tokens["Department Employee"] }
    )
}

# Ensure thunder-tests directory exists
if (-not (Test-Path "thunder-tests")) {
    New-Item -ItemType Directory -Path "thunder-tests" | Out-Null
}

$thunderEnv | ConvertTo-Json -Depth 5 | Out-File $thunderEnvFile
Write-Host "Thunder Client environment saved to: $thunderEnvFile" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Import tokens to Thunder Client/Postman" -ForegroundColor White
Write-Host "2. Run: .\test-payroll-execution.ps1" -ForegroundColor White
Write-Host "3. Or test manually using tokens above" -ForegroundColor White
Write-Host ""
Write-Host "For testing guide: AUTH_TOKEN_GUIDE.md" -ForegroundColor Cyan
