# Complete Testing Setup - Quick Start

This guide helps you set up authentication and test the payroll execution system in 3 simple steps.

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Server
```powershell
cd Milestone2/HR-System-main
npm install
npm run start:dev
```
Wait until you see: `Application is running on: http://localhost:3000`

### Step 2: Register Users & Get Tokens
```powershell
.\register-and-login.ps1
```
This will:
- ✅ Register users for all roles (Payroll Specialist, Manager, Finance, etc.)
- ✅ Login each user and collect JWT tokens
- ✅ Save tokens to `jwt-tokens.json`
- ✅ Create Thunder Client environment file

### Step 3: Run Payroll Tests
```powershell
.\test-payroll-execution.ps1
```
This will run a complete payroll cycle:
- ✅ Seed test data
- ✅ Initiate payroll period
- ✅ Calculate salaries
- ✅ Submit for approval
- ✅ Manager & Finance review
- ✅ Execute and distribute payslips

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `AUTH_TOKEN_GUIDE.md` | Complete guide to register users and get JWT tokens |
| `PAYROLL_EXECUTION_TESTING_GUIDE.md` | Detailed testing scenarios for all payroll endpoints |
| `TESTING_CHEAT_SHEET.md` | Quick reference for common commands and workflows |
| `register-and-login.ps1` | Automated script to register users and collect tokens |
| `test-payroll-execution.ps1` | Automated script to test complete payroll flow |
| `jwt-tokens.json` | Generated file with all JWT tokens (after running script) |

---

## 🎯 What Gets Tested

### Phase 0: Pre-Run Reviews
- ✅ Seed test benefits (signing bonuses, terminations)
- ✅ View pending benefits
- ✅ Approve/reject benefits

### Phase 1: Period Management
- ✅ Initiate payroll period (PR-2025-DEC)
- ✅ Approve period (triggers employee fetch)
- ✅ View eligible employees

### Phase 2: Calculations
- ✅ Calculate payroll (tax + insurance + deductions)
- ✅ View calculated payslips
- ✅ Add manual adjustments (bonuses/deductions)

### Phase 3: Approvals
- ✅ Submit for approval (anomaly detection)
- ✅ Manager review and approval
- ✅ Finance review and approval
- ✅ Preview dashboard

### Phase 4: Execution
- ✅ Execute and distribute payslips
- ✅ View detailed payslip (with tax breakdown)
- ✅ Verify payroll locked

---

## 🔐 Available User Accounts

After running `register-and-login.ps1`, you'll have these accounts:

| Role | Email | Password |
|------|-------|----------|
| Payroll Specialist | sarah.specialist@company.com | specialist123 |
| Payroll Manager | michael.manager@company.com | manager123 |
| Finance Staff | emily.finance@company.com | finance123 |
| HR Manager | robert.hr@company.com | hrmanager123 |
| HR Employee | jennifer.hr@company.com | hremp123 |
| HR Admin | david.admin@company.com | hradmin123 |
| System Admin | admin@company.com | admin123 |
| Department Head | james.head@company.com | depthead123 |
| Department Employee | lisa.emp@company.com | employee123 |

---

## 🔧 Manual Testing with Thunder Client

### Option 1: Import Collection
1. Install Thunder Client extension in VS Code
2. Import `thunder-tests/thunderclient.json`
3. Import `thunder-tests/thunderclient-env.json` (generated after running register-and-login.ps1)
4. Start testing with pre-configured requests!

### Option 2: Manual Requests
1. Open `AUTH_TOKEN_GUIDE.md`
2. Follow registration steps
3. Copy tokens to your HTTP client
4. Follow `PAYROLL_EXECUTION_TESTING_GUIDE.md` for testing scenarios

---

## 📊 Expected Results

### After Registration Script
```
✓ 9 users registered successfully
✓ 9 JWT tokens collected
✓ Tokens saved to jwt-tokens.json
✓ Thunder Client environment created
```

### After Payroll Test Script
```
✓ Test data seeded (employees, benefits, penalties)
✓ Payroll run PR-2025-DEC created
✓ 10+ employees calculated with tax/insurance
✓ Anomaly detection passed
✓ Manager approved
✓ Finance approved
✓ Payslips executed and distributed
✓ Payroll automatically locked
```

---

## 🐛 Troubleshooting

### "Connection refused" or "Cannot connect"
**Solution**: Ensure server is running on port 3000
```powershell
npm run start:dev
```

### "User already exists" during registration
**Solution**: Normal! Script will skip and proceed to login

### "Invalid credentials" during login
**Solution**: Check if MongoDB is running and users were created

### "Unauthorized" during payroll tests
**Solution**: 
1. Re-run `register-and-login.ps1` to get fresh tokens
2. Check tokens are saved in `jwt-tokens.json`

---

## 🎓 Learning Path

1. **First Time**: Run automated scripts to see full flow
2. **Understanding**: Read testing guides to understand each step
3. **Manual Testing**: Use Thunder Client with saved tokens
4. **Advanced**: Test error scenarios and edge cases
5. **Integration**: Test with real employee data

---

## 📝 Common Workflows

### Test Complete Payroll Cycle
```powershell
.\register-and-login.ps1    # Get tokens
.\test-payroll-execution.ps1 # Run tests
```

### Reset and Start Fresh
```bash
POST http://localhost:3000/payroll-execution/seed/clear
# Then run test script again
```

### Test Specific Scenario
1. Open `TESTING_CHEAT_SHEET.md`
2. Find scenario (e.g., "Manager Rejection")
3. Copy commands and test manually

---

## ✅ Success Indicators

| Metric | Target | Check |
|--------|--------|-------|
| Users registered | 9 | ✅ |
| Tokens collected | 9 | ✅ |
| Payroll run created | 1 | ✅ |
| Employees processed | 10+ | ✅ |
| Anomalies | 0 critical | ✅ |
| Approvals | Manager + Finance | ✅ |
| Payslips distributed | All employees | ✅ |
| Status | Locked | ✅ |

---

## 🎯 Testing Checklist

Before deployment, verify:

- [ ] All users can register successfully
- [ ] All users can login and receive JWT tokens
- [ ] Payroll Specialist can initiate period
- [ ] Calculations include progressive tax (BR 5, 6)
- [ ] Calculations include insurance brackets (BR 7, 8)
- [ ] Anomaly detection catches critical issues
- [ ] Manager can approve/reject
- [ ] Finance can approve/reject
- [ ] Payslips are generated and distributed (REQ-PY-8)
- [ ] Payroll locks automatically after execution (REQ-PY-7)
- [ ] Unfreeze requires justification (REQ-PY-19)
- [ ] Tax laws displayed in payslip details (REQ-PY-8)

---

## 🔗 API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout

### Payroll Execution
- `POST /payroll-execution/seed/benefits` - Seed test data
- `POST /payroll-execution/period` - Initiate payroll period
- `POST /payroll-execution/runs/:runId/calculate` - Calculate payroll
- `PATCH /payroll-execution/runs/:runId/submit` - Submit for approval
- `PATCH /payroll-execution/runs/:runId/manager-review` - Manager review
- `PATCH /payroll-execution/runs/:runId/finance-review` - Finance review
- `PATCH /payroll-execution/runs/:runId/execute-and-distribute` - Execute payroll
- `GET /payroll-execution/payslips/:employeeId/run/:runId` - View payslip details

**For complete endpoint list**: See `PAYROLL_EXECUTION_TESTING_GUIDE.md`

---

## 📞 Need Help?

1. **Authentication Issues**: See `AUTH_TOKEN_GUIDE.md`
2. **Payroll Testing**: See `PAYROLL_EXECUTION_TESTING_GUIDE.md`
3. **Quick Commands**: See `TESTING_CHEAT_SHEET.md`
4. **Debug Mode**: Check `test/db-status` endpoint for database state

---

## 🚦 System Status Check

Before testing, verify system is ready:

```powershell
# Check server is running
Test-NetConnection localhost -Port 3000

# Check database status
Invoke-RestMethod http://localhost:3000/payroll-execution/test/db-status
```

---

**Happy Testing! 🎉**

All scripts are ready to use. Just run the commands in order and you'll have a fully tested payroll execution system.
