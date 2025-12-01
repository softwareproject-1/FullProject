# Authentication & Token Generation Guide

Complete guide to register users for all roles and obtain JWT tokens for testing.

## 🔐 Available System Roles

```typescript
1. System Admin
2. HR Manager
3. HR Employee
4. HR Admin
5. Payroll Specialist
6. Payroll Manager
7. Finance Staff
8. Legal & Policy Admin
9. Recruiter
10. Department Head
11. Department Employee
12. Job Candidate
```

---

## 📝 Step-by-Step Token Generation

### Prerequisites
- Server running on `http://localhost:3000`
- MongoDB connected
- Base URL: `http://localhost:3000/auth`

---

## 1️⃣ Register Users for Each Role

### 1.1 Payroll Specialist
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Sarah",
  "middleName": "Jane",
  "lastName": "Specialist",
  "nationalId": "10000000000001",
  "password": "specialist123",
  "personalEmail": "sarah.specialist@personal.com",
  "mobilePhone": "+201000000001",
  "employeeNumber": "EMP-PS-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "sarah.specialist@company.com"
}
```

### 1.2 Payroll Manager
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Michael",
  "middleName": "James",
  "lastName": "Manager",
  "nationalId": "10000000000002",
  "password": "manager123",
  "personalEmail": "michael.manager@personal.com",
  "mobilePhone": "+201000000002",
  "employeeNumber": "EMP-PM-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "michael.manager@company.com"
}
```

### 1.3 Finance Staff
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Emily",
  "middleName": "Rose",
  "lastName": "Finance",
  "nationalId": "10000000000003",
  "password": "finance123",
  "personalEmail": "emily.finance@personal.com",
  "mobilePhone": "+201000000003",
  "employeeNumber": "EMP-FIN-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "emily.finance@company.com"
}
```

### 1.4 HR Manager
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Robert",
  "middleName": "William",
  "lastName": "HRManager",
  "nationalId": "10000000000004",
  "password": "hrmanager123",
  "personalEmail": "robert.hr@personal.com",
  "mobilePhone": "+201000000004",
  "employeeNumber": "EMP-HRM-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "robert.hr@company.com"
}
```

### 1.5 HR Employee
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Jennifer",
  "middleName": "Anne",
  "lastName": "HREmployee",
  "nationalId": "10000000000005",
  "password": "hremp123",
  "personalEmail": "jennifer.hr@personal.com",
  "mobilePhone": "+201000000005",
  "employeeNumber": "EMP-HRE-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "jennifer.hr@company.com"
}
```

### 1.6 HR Admin
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "David",
  "middleName": "John",
  "lastName": "HRAdmin",
  "nationalId": "10000000000006",
  "password": "hradmin123",
  "personalEmail": "david.admin@personal.com",
  "mobilePhone": "+201000000006",
  "employeeNumber": "EMP-HRA-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "david.admin@company.com"
}
```

### 1.7 System Admin
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "middleName": "System",
  "lastName": "Root",
  "nationalId": "10000000000007",
  "password": "admin123",
  "personalEmail": "admin@personal.com",
  "mobilePhone": "+201000000007",
  "employeeNumber": "EMP-ADM-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "admin@company.com"
}
```

### 1.8 Department Head
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "James",
  "middleName": "Robert",
  "lastName": "DeptHead",
  "nationalId": "10000000000008",
  "password": "depthead123",
  "personalEmail": "james.head@personal.com",
  "mobilePhone": "+201000000008",
  "employeeNumber": "EMP-DH-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "james.head@company.com"
}
```

### 1.9 Department Employee
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Lisa",
  "middleName": "Marie",
  "lastName": "Employee",
  "nationalId": "10000000000009",
  "password": "employee123",
  "personalEmail": "lisa.emp@personal.com",
  "mobilePhone": "+201000000009",
  "employeeNumber": "EMP-DE-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "lisa.emp@company.com"
}
```

### 1.10 Legal & Policy Admin
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Thomas",
  "middleName": "Edward",
  "lastName": "Legal",
  "nationalId": "10000000000010",
  "password": "legal123",
  "personalEmail": "thomas.legal@personal.com",
  "mobilePhone": "+201000000010",
  "employeeNumber": "EMP-LPA-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "thomas.legal@company.com"
}
```

### 1.11 Recruiter
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "Rachel",
  "middleName": "Lynn",
  "lastName": "Recruiter",
  "nationalId": "10000000000011",
  "password": "recruiter123",
  "personalEmail": "rachel.recruiter@personal.com",
  "mobilePhone": "+201000000011",
  "employeeNumber": "EMP-REC-001",
  "dateOfHire": "2024-01-15",
  "workEmail": "rachel.recruiter@company.com"
}
```

---

## 2️⃣ Login and Get JWT Tokens

### Login Options
You can login using any of:
- `workEmail`
- `personalEmail`
- `nationalId`

### 2.1 Payroll Specialist Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "workEmail": "sarah.specialist@company.com",
  "password": "specialist123"
}
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "user": {
    "userId": "...",
    "email": "sarah.specialist@company.com",
    "roles": ["Payroll Specialist"],
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Extract Token**: Copy the `access_token` value

### 2.2 Payroll Manager Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "workEmail": "michael.manager@company.com",
  "password": "manager123"
}
```

### 2.3 Finance Staff Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "workEmail": "emily.finance@company.com",
  "password": "finance123"
}
```

### 2.4 HR Manager Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "workEmail": "robert.hr@company.com",
  "password": "hrmanager123"
}
```

### 2.5 System Admin Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "workEmail": "admin@company.com",
  "password": "admin123"
}
```

---

## 3️⃣ Using JWT Tokens

### In HTTP Headers
```bash
GET http://localhost:3000/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### In Thunder Client / Postman
1. Go to **Headers** tab
2. Add header:
   - **Key**: `Authorization`
   - **Value**: `Bearer <YOUR_TOKEN_HERE>`

### Environment Variables (Recommended)
Create environment variables in Thunder Client/Postman:

```json
{
  "SPECIALIST_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5...",
  "MANAGER_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5...",
  "FINANCE_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5...",
  "HR_MANAGER_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5...",
  "ADMIN_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

Then use: `Authorization: Bearer {{SPECIALIST_TOKEN}}`

---

## 4️⃣ Verify Token Works

### Test Authentication
```bash
GET http://localhost:3000/auth/me
Authorization: Bearer <YOUR_TOKEN>
```

**Expected Response:**
```json
{
  "id": "675c1234567890abcdef1234",
  "firstName": "Sarah",
  "middleName": "Jane",
  "lastName": "Specialist",
  "nationalId": "10000000000001",
  "employeeNumber": "EMP-PS-001",
  "personalEmail": "sarah.specialist@personal.com",
  "workEmail": "sarah.specialist@company.com",
  "mobilePhone": "+201000000001",
  "roles": ["Payroll Specialist"],
  "permissions": [],
  "status": "ACTIVE"
}
```

---

## 5️⃣ Quick Token Collection Script

Save this PowerShell script as `get-all-tokens.ps1`:

```powershell
# Get All JWT Tokens Script
$baseUrl = "http://localhost:3000/auth"

$users = @(
    @{ email = "sarah.specialist@company.com"; password = "specialist123"; role = "Payroll Specialist" },
    @{ email = "michael.manager@company.com"; password = "manager123"; role = "Payroll Manager" },
    @{ email = "emily.finance@company.com"; password = "finance123"; role = "Finance Staff" },
    @{ email = "robert.hr@company.com"; password = "hrmanager123"; role = "HR Manager" },
    @{ email = "admin@company.com"; password = "admin123"; role = "System Admin" }
)

Write-Host "Collecting JWT Tokens..." -ForegroundColor Cyan
Write-Host ""

$tokens = @{}

foreach ($user in $users) {
    try {
        $body = @{
            workEmail = $user.email
            password = $user.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Method POST -Uri "$baseUrl/login" -Body $body -ContentType "application/json"
        
        $token = $response.user.access_token
        $tokens[$user.role] = $token
        
        Write-Host "✓ $($user.role)" -ForegroundColor Green
        Write-Host "  Token: $token" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "✗ $($user.role) - Failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Token Collection Complete" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Save to file
$tokens | ConvertTo-Json | Out-File "jwt-tokens.json"
Write-Host "Tokens saved to jwt-tokens.json" -ForegroundColor Yellow
```

Run with: `.\get-all-tokens.ps1`

---

## 6️⃣ Role-Based Access for Payroll

| Endpoint | Payroll Specialist | Payroll Manager | Finance Staff |
|----------|-------------------|-----------------|---------------|
| Benefits Review | ✅ | ✅ | ❌ |
| Initiate Period | ✅ | ❌ | ❌ |
| Calculate | ✅ | ❌ | ❌ |
| Manual Adjustment | ✅ | ✅ | ❌ |
| Submit for Approval | ✅ | ❌ | ❌ |
| Manager Review | ❌ | ✅ | ❌ |
| Finance Review | ❌ | ❌ | ✅ |
| Execute & Distribute | ❌ | ❌ | ✅ |
| Lock/Unfreeze | ❌ | ✅ | ❌ |
| View Payslips | ✅ | ✅ | ✅ |

---

## 7️⃣ Testing Workflow with Tokens

### Complete Payroll Flow

```bash
# 1. Register all users (run once)
# Use registration requests above

# 2. Login and collect tokens
POST /auth/login (for each role)

# 3. Use tokens in payroll workflow

# Payroll Specialist Token
POST /payroll-execution/period
Authorization: Bearer {{SPECIALIST_TOKEN}}

# Payroll Manager Token
PATCH /payroll-execution/runs/PR-2025-DEC/manager-review
Authorization: Bearer {{MANAGER_TOKEN}}

# Finance Staff Token
PATCH /payroll-execution/runs/PR-2025-DEC/finance-review
Authorization: Bearer {{FINANCE_TOKEN}}
```

---

## 8️⃣ Troubleshooting

### Issue: "User already exists"
**Solution**: User already registered, just login

### Issue: "Invalid credentials"
**Solution**: Check email/nationalId and password are correct

### Issue: "Unauthorized"
**Solution**: 
1. Verify token is not expired
2. Check token is properly formatted: `Bearer <token>`
3. Login again to get fresh token

### Issue: "Insufficient permissions"
**Solution**: Verify you're using correct role token for the endpoint

---

## 9️⃣ Token Management Tips

1. **Token Expiry**: JWT tokens expire after 24 hours by default
2. **Refresh Tokens**: Login again when token expires
3. **Store Securely**: Never commit tokens to version control
4. **Environment Files**: Use `.env` or environment variables
5. **Logout**: Use `/auth/logout` to invalidate session

---

## 🔟 Quick Reference

### Registration Template
```json
{
  "firstName": "...",
  "middleName": "...",
  "lastName": "...",
  "nationalId": "...",
  "password": "...",
  "personalEmail": "...@personal.com",
  "mobilePhone": "+20...",
  "employeeNumber": "EMP-...",
  "dateOfHire": "2024-01-15",
  "workEmail": "...@company.com"
}
```

### Login Template
```json
{
  "workEmail": "...@company.com",
  "password": "..."
}
```

### Using Token
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 📚 Next Steps

After getting tokens:
1. Import `thunder-tests/thunderclient.json` to Thunder Client
2. Update environment variables with your tokens
3. Follow `PAYROLL_EXECUTION_TESTING_GUIDE.md`
4. Run `test-payroll-execution.ps1` for automated tests

---

**Need Help?** Refer to `TESTING_CHEAT_SHEET.md` for quick commands.
