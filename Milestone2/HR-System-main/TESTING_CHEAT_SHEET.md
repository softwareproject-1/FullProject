# Payroll Execution - Quick Testing Cheat Sheet

## 🚀 Quick Start (5 Minutes)

### 1. Start Server
```powershell
cd Milestone2/HR-System-main
npm run start:dev
```

### 2. Run Automated Test
```powershell
.\test-payroll-execution.ps1
```

---

## 📋 Manual Testing - Essential Endpoints

### Setup (Run First)
```bash
# 1. Seed test data
POST /payroll-execution/seed/benefits

# 2. Check status
GET /payroll-execution/test/db-status
```

### Complete Flow (18 Steps)
```bash
# PHASE 0: Benefits
GET    /payroll-execution/benefits/pending
PATCH  /payroll-execution/benefits/review

# PHASE 1: Initiate
POST   /payroll-execution/period
PATCH  /payroll-execution/period/review
GET    /payroll-execution/drafts/PR-2025-DEC/employees

# PHASE 2: Calculate
POST   /payroll-execution/runs/PR-2025-DEC/calculate
GET    /payroll-execution/runs/PR-2025-DEC/payslips
PATCH  /payroll-execution/payslips/{id}/adjust

# PHASE 3: Approve
PATCH  /payroll-execution/runs/PR-2025-DEC/submit
PATCH  /payroll-execution/runs/PR-2025-DEC/manager-review
GET    /payroll-execution/runs/PR-2025-DEC/preview
PATCH  /payroll-execution/runs/PR-2025-DEC/finance-review

# PHASE 4: Execute
PATCH  /payroll-execution/runs/PR-2025-DEC/execute-and-distribute
GET    /payroll-execution/payslips/{employeeId}/run/PR-2025-DEC

# PHASE 5: Lock/Unfreeze
PATCH  /payroll-execution/runs/PR-2025-DEC/lock
PATCH  /payroll-execution/runs/PR-2025-DEC/unfreeze
```

---

## 🔧 Common Request Bodies

### Initiate Period
```json
{
  "month": "DEC",
  "year": 2025,
  "entity": "Tech Corp"
}
```

### Review Benefit (Approve)
```json
{
  "benefitId": "...",
  "type": "SIGNING_BONUS",
  "action": "APPROVE",
  "comment": "Approved"
}
```

### Period Review
```json
{
  "runId": "PR-2025-DEC",
  "action": "APPROVE",
  "comment": "Period approved"
}
```

### Manual Adjustment (Bonus)
```json
{
  "type": "BONUS",
  "amount": 500,
  "reason": "Performance bonus"
}
```

### Manual Adjustment (Deduction)
```json
{
  "type": "DEDUCTION",
  "amount": 200,
  "reason": "Late arrival"
}
```

### Manager/Finance Review (Approve)
```json
{
  "status": "APPROVED",
  "comment": "Approved"
}
```

### Manager/Finance Review (Reject)
```json
{
  "status": "REJECTED",
  "comment": "Needs corrections"
}
```

### Unfreeze Payroll
```json
{
  "justification": "Critical error - urgent correction needed"
}
```

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path
1. Seed → Initiate → Approve Period
2. Calculate → Submit → Manager Approve
3. Finance Approve → Execute → Lock
**Expected**: All payslips distributed, run locked

### Scenario 2: Manager Rejection
1. Seed → Initiate → Calculate → Submit
2. Manager REJECTS
**Expected**: Status returns to "draft"

### Scenario 3: Finance Rejection
1. Complete up to Manager Approve
2. Finance REJECTS
**Expected**: Status returns to "draft"

### Scenario 4: Manual Adjustments
1. Calculate payroll
2. Add bonus to payslip
3. Submit and approve
**Expected**: Net pay increased

### Scenario 5: Anomaly Detection
1. Calculate with missing bank details
2. Submit for approval
**Expected**: Major anomaly flagged

### Scenario 6: Lock & Unfreeze
1. Complete execution
2. Lock payroll
3. Unfreeze with justification
**Expected**: Can make corrections

---

## ✅ Success Indicators

| Phase | Success Indicator |
|-------|------------------|
| **Seed** | `success: true` |
| **Initiate** | `runId: "PR-2025-DEC"` |
| **Calculate** | `status: "calculated"` |
| **Submit** | `status: "under review"` |
| **Manager** | `status: "pending finance approval"` |
| **Finance** | `status: "approved"` |
| **Execute** | `status: "locked"` |
| **Payslips** | `distribution: { pdf, email, portal }` |

---

## 🐛 Debug Endpoints

```bash
# Check database
GET /payroll-execution/test/db-status

# Check employees
GET /payroll-execution/debug/employees-data

# Check run employees
GET /payroll-execution/debug/run/PR-2025-DEC/employees

# Check HR events
POST /payroll-execution/events/check
```

---

## 🔄 Reset Testing

```bash
# Clear all data and start fresh
POST /payroll-execution/seed/clear
```

---

## 📊 Expected Response Times

| Operation | Expected Time |
|-----------|--------------|
| Seed Data | < 2 seconds |
| Initiate Period | < 1 second |
| Calculate (10 employees) | < 3 seconds |
| Calculate (100 employees) | < 30 seconds |
| Submit/Approve | < 1 second |
| Execute | < 5 seconds |

---

## 🚨 Common Errors & Fixes

### Error: "Payroll Run not found"
**Fix**: Check runId format (e.g., "PR-2025-DEC")

### Error: "No employees found"
**Fix**: Run debug endpoint to check employee collection

### Error: "Critical anomalies detected"
**Fix**: Check response for anomaly details, fix issues, resubmit

### Error: "Not ready for execution"
**Fix**: Ensure both manager and finance approved

### Error: "Cannot modify locked payroll"
**Fix**: Unfreeze with justification first

---

## 📝 Testing Checklist

- [ ] Seed test data successfully
- [ ] Initiate period for current month
- [ ] Approve period and fetch employees
- [ ] Calculate payroll (tax + insurance)
- [ ] View calculated payslips
- [ ] Add manual adjustment
- [ ] Submit for approval (pass anomaly check)
- [ ] Manager approves
- [ ] View preview dashboard
- [ ] Finance approves
- [ ] Execute and distribute payslips
- [ ] View employee payslip details
- [ ] Verify payroll locked
- [ ] Test unfreeze with justification
- [ ] Clear test data

---

## 🔐 Required Roles

| Endpoint | Required Role |
|----------|--------------|
| Benefits Review | Payroll Specialist |
| Initiate Period | Payroll Specialist |
| Calculate | Payroll Specialist |
| Submit | Payroll Specialist |
| Manager Review | Payroll Manager |
| Finance Review | Finance Staff |
| Execute | Finance Staff |
| Lock/Unfreeze | Payroll Manager |
| View Payslip | Employee (own only) |

---

## 📚 Documentation

- Full Guide: `PAYROLL_EXECUTION_TESTING_GUIDE.md`
- Thunder Client: `thunder-tests/thunderclient.json`
- Automated Test: `test-payroll-execution.ps1`

---

## 💡 Pro Tips

1. **Use Thunder Client Extension** for VS Code
2. **Save JWT tokens** as environment variables
3. **Test each phase** before moving to next
4. **Check anomaly details** before fixing issues
5. **Use debug endpoints** when stuck
6. **Reset with seed/clear** between test runs

---

## 🎓 Learning Path

1. Start with automated script to see full flow
2. Run manual tests for each endpoint
3. Test error scenarios (rejections, anomalies)
4. Test edge cases (invalid data, locked payroll)
5. Test performance (large employee count)

---

**Need Help?** Check `PAYROLL_EXECUTION_TESTING_GUIDE.md` for detailed scenarios and examples.
