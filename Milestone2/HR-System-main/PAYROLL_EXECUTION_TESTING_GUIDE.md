# Payroll Execution - Complete Testing Guide

This guide provides comprehensive testing instructions for all payroll execution endpoints.

## Prerequisites

1. **MongoDB Running**: Ensure MongoDB is running
2. **Server Started**: Run `npm run start:dev`
3. **Authentication**: You'll need JWT tokens for different roles:
   - Payroll Specialist
   - Payroll Manager
   - Finance Staff

## Testing Flow Overview

The payroll execution process follows this sequence:

```
Phase 0: Pre-Run Reviews (Benefits & Events)
  ↓
Phase 1: Period Initiation & Draft Creation
  ↓
Phase 1.1: Fetch Eligible Employees & Snapshot
  ↓
Phase 1.2: Calculate Salaries (Tax, Insurance, Adjustments)
  ↓
Phase 2: Submit for Approval (Anomaly Detection)
  ↓
Phase 3: Manager Review → Finance Review
  ↓
Phase 4: Preview Dashboard
  ↓
Phase 5: Execute & Distribute Payslips
  ↓
Phase 6: Lock Payroll (Prevent Changes)
```

---

## Quick Start - Automated Test Sequence

### Step 1: Seed Test Data
```bash
POST http://localhost:3000/payroll-execution/seed/benefits
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Test benefits seeded successfully",
  "data": {
    "signingBonuses": { "total": 3, "pending": 2, "approved": 1 },
    "terminationBenefits": { "total": 1, "pending": 1 }
  }
}
```

### Step 2: Check Database Status
```bash
GET http://localhost:3000/payroll-execution/test/db-status
```

### Step 3: View Pending Benefits
```bash
GET http://localhost:3000/payroll-execution/benefits/pending
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>
```

### Step 4: Review Benefits (Approve)
```bash
PATCH http://localhost:3000/payroll-execution/benefits/review
Content-Type: application/json
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>

{
  "benefitId": "<BENEFIT_ID_FROM_STEP_3>",
  "type": "SIGNING_BONUS",
  "action": "APPROVE",
  "comment": "Approved - employee qualifies"
}
```

### Step 5: Initiate Payroll Period
```bash
POST http://localhost:3000/payroll-execution/period
Content-Type: application/json
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>

{
  "month": "DEC",
  "year": 2025,
  "entity": "Tech Corp"
}
```
**Expected Response:**
```json
{
  "runId": "PR-2025-DEC",
  "status": "draft",
  "payrollPeriod": "2025-12-01T00:00:00.000Z",
  "entity": "Tech Corp"
}
```

### Step 6: Approve Period (Triggers Employee Fetch)
```bash
PATCH http://localhost:3000/payroll-execution/period/review
Content-Type: application/json
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>

{
  "runId": "PR-2025-DEC",
  "action": "APPROVE",
  "comment": "Period approved"
}
```

### Step 7: View Eligible Employees
```bash
GET http://localhost:3000/payroll-execution/drafts/PR-2025-DEC/employees
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>
```

### Step 8: Calculate Payroll
```bash
POST http://localhost:3000/payroll-execution/runs/PR-2025-DEC/calculate
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>
```
**Expected Response:**
```json
{
  "message": "Payroll calculations completed successfully",
  "runId": "PR-2025-DEC",
  "employeesProcessed": 10,
  "totalNetPay": 85000,
  "status": "calculated"
}
```

### Step 9: View Payslips
```bash
GET http://localhost:3000/payroll-execution/runs/PR-2025-DEC/payslips
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>
```

### Step 10: Add Manual Adjustment (Optional)
```bash
PATCH http://localhost:3000/payroll-execution/payslips/<PAYSLIP_ID>/adjust
Content-Type: application/json
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>

{
  "type": "BONUS",
  "amount": 500,
  "reason": "Performance bonus"
}
```

### Step 11: Submit for Approval (Anomaly Detection)
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/submit
Authorization: Bearer <PAYROLL_SPECIALIST_TOKEN>
```
**Expected Response:**
```json
{
  "message": "Payroll run submitted for manager approval",
  "runId": "PR-2025-DEC",
  "status": "under review",
  "anomalyDetection": {
    "totalAnomalies": 2,
    "major": 1,
    "minor": 1,
    "details": { ... }
  }
}
```

### Step 12: Manager Review (Approve)
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/manager-review
Content-Type: application/json
Authorization: Bearer <PAYROLL_MANAGER_TOKEN>

{
  "status": "APPROVED",
  "comment": "Reviewed and approved by manager"
}
```

### Step 13: Preview Dashboard
```bash
GET http://localhost:3000/payroll-execution/runs/PR-2025-DEC/preview
Authorization: Bearer <FINANCE_STAFF_TOKEN>
```
**Expected Response:**
```json
{
  "runId": "PR-2025-DEC",
  "status": "pending finance approval",
  "employeeSummary": {
    "totalEmployees": 10,
    "activeEmployees": 8,
    "exceptionsCount": 2
  },
  "financialBreakdown": {
    "totalGrossSalary": 100000,
    "totalTaxes": 8000,
    "totalInsurance": 5000,
    "totalNetPayout": 87000
  }
}
```

### Step 14: Finance Review (Approve)
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/finance-review
Content-Type: application/json
Authorization: Bearer <FINANCE_STAFF_TOKEN>

{
  "status": "APPROVED",
  "comment": "Final approval - ready for execution"
}
```

### Step 15: Execute & Distribute Payslips
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/execute-and-distribute
Authorization: Bearer <FINANCE_STAFF_TOKEN>
```
**Expected Response:**
```json
{
  "message": "Payroll executed successfully. Payslips automatically generated, archived, and distributed. Run is now LOCKED.",
  "runId": "PR-2025-DEC",
  "status": "locked",
  "totalDisbursement": 87000,
  "employeesPaid": 10,
  "payslipsGenerated": 10,
  "distribution": {
    "pdfGenerated": 10,
    "emailsQueued": 10,
    "portalAccessEnabled": 10
  }
}
```

### Step 16: View Employee Payslip Details
```bash
GET http://localhost:3000/payroll-execution/payslips/<EMPLOYEE_ID>/run/PR-2025-DEC
Authorization: Bearer <EMPLOYEE_TOKEN>
```

### Step 17: Unfreeze Payroll (If Corrections Needed)
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/unfreeze
Content-Type: application/json
Authorization: Bearer <PAYROLL_MANAGER_TOKEN>

{
  "justification": "Critical error found - employee salary miscalculated"
}
```

---

## Detailed Testing Scenarios

### Scenario 1: Happy Path - Complete Payroll Cycle
**Objective**: Test full payroll workflow from initiation to execution

**Steps**: Follow Steps 1-16 above

**Expected Outcome**: 
- Payroll created, calculated, approved, and executed
- All payslips distributed
- Run locked automatically

---

### Scenario 2: Benefit Review - Approve & Reject
**Objective**: Test benefit approval/rejection workflow

**Test 2.1: Approve Signing Bonus**
```bash
PATCH http://localhost:3000/payroll-execution/benefits/review
Content-Type: application/json

{
  "benefitId": "<BONUS_ID>",
  "type": "SIGNING_BONUS",
  "action": "APPROVE",
  "comment": "New hire eligible for signing bonus"
}
```

**Test 2.2: Reject Termination Benefit**
```bash
PATCH http://localhost:3000/payroll-execution/benefits/review
Content-Type: application/json

{
  "benefitId": "<TERMINATION_ID>",
  "type": "TERMINATION",
  "action": "REJECT",
  "comment": "Employee not eligible - voluntary resignation"
}
```

---

### Scenario 3: Anomaly Detection
**Objective**: Test anomaly detection triggers critical/major/minor alerts

**Test 3.1: Negative Salary Detection**
- Create payslip with deductions > gross salary
- Submit for approval
- **Expected**: Critical anomaly, submission blocked

**Test 3.2: Missing Bank Details**
- Employee without bank account
- Submit for approval
- **Expected**: Major anomaly flagged

**Test 3.3: Below Minimum Wage**
- Employee salary < 3000 EGP
- Submit for approval
- **Expected**: Major anomaly flagged

---

### Scenario 4: Manual Adjustments
**Objective**: Test bonus/deduction adjustments

**Test 4.1: Add Performance Bonus**
```bash
PATCH http://localhost:3000/payroll-execution/payslips/<PAYSLIP_ID>/adjust
Content-Type: application/json

{
  "type": "BONUS",
  "amount": 1000,
  "reason": "Exceptional performance this quarter"
}
```
**Expected**: Net pay increased by 1000

**Test 4.2: Add Penalty Deduction**
```bash
PATCH http://localhost:3000/payroll-execution/payslips/<PAYSLIP_ID>/adjust
Content-Type: application/json

{
  "type": "DEDUCTION",
  "amount": 200,
  "reason": "Late arrival - 3 days"
}
```
**Expected**: Net pay decreased by 200

---

### Scenario 5: Manager Rejection
**Objective**: Test payroll rejection and return to draft

**Steps**:
1. Submit payroll for approval
2. Manager rejects with comment
3. Verify run status returns to "draft"
4. Make corrections
5. Resubmit

**Manager Rejection Request**:
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/manager-review
Content-Type: application/json

{
  "status": "REJECTED",
  "comment": "Found errors in employee deductions - needs review"
}
```

---

### Scenario 6: Finance Rejection
**Objective**: Test finance rejection after manager approval

**Steps**:
1. Manager approves
2. Finance rejects with comment
3. Verify run returns to "draft"

**Finance Rejection Request**:
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/finance-review
Content-Type: application/json

{
  "status": "REJECTED",
  "comment": "Budget constraints - defer to next period"
}
```

---

### Scenario 7: Lock & Unfreeze
**Objective**: Test payroll locking and emergency unfreeze

**Test 7.1: Lock Approved Payroll**
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/lock
Authorization: Bearer <PAYROLL_MANAGER_TOKEN>
```
**Expected**: Status = "locked", no edits allowed

**Test 7.2: Unfreeze with Justification**
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/unfreeze
Content-Type: application/json

{
  "justification": "Critical calculation error discovered - urgent correction needed"
}
```
**Expected**: Status = "unlocked", edits allowed

---

### Scenario 8: Payslip Details & Tax Breakdown
**Objective**: Test detailed payslip view with tax laws

**Request**:
```bash
GET http://localhost:3000/payroll-execution/payslips/<EMPLOYEE_ID>/run/PR-2025-DEC
```

**Expected Response Structure**:
```json
{
  "payslipId": "...",
  "employeeId": "...",
  "earnings": {
    "baseSalary": 5000,
    "allowances": [...],
    "bonuses": [...],
    "totalGross": 5500
  },
  "deductions": {
    "taxes": [
      {
        "type": "Income Tax",
        "rate": 10,
        "amount": 500,
        "law": "Federal Tax Code Section 401 (2024)",
        "bracket": "Bracket 2: $3000-$6000 (10%)"
      }
    ],
    "insurances": [...],
    "penalties": [...],
    "totalDeductions": 800
  },
  "netPayCalculation": {
    "grossSalary": 5500,
    "totalDeductions": 800,
    "netPay": 4700
  },
  "distribution": {
    "pdf": { "available": true, "downloadUrl": "/payslips/.../download" },
    "email": { "sent": true, "status": "DELIVERED" },
    "portal": { "accessible": true }
  }
}
```

---

## Testing Edge Cases

### Edge Case 1: Duplicate Run Prevention
**Objective**: Ensure duplicate payroll runs are blocked

**Test**:
1. Create run for "DEC 2025"
2. Attempt to create another run for "DEC 2025"
3. **Expected**: Error - "Payroll run for this period already exists"

### Edge Case 2: Invalid Month/Year
**Test Invalid Month**:
```bash
POST http://localhost:3000/payroll-execution/period
Content-Type: application/json

{
  "month": "INVALID",
  "year": 2025,
  "entity": "Tech Corp"
}
```
**Expected**: 400 Bad Request - "Invalid month"

### Edge Case 3: Invalid Payslip ID
**Test**:
```bash
PATCH http://localhost:3000/payroll-execution/payslips/invalid-id/adjust
```
**Expected**: 400 Bad Request - "Invalid payslip ID format"

### Edge Case 4: Status Transition Violations
**Test**: Try to execute payroll without finance approval
```bash
PATCH http://localhost:3000/payroll-execution/runs/PR-2025-DEC/execute-and-distribute
```
**Expected**: 400 Bad Request - "Run is not ready for finance execution"

---

## Performance Testing

### Test 1: Large Payroll Run (100+ Employees)
1. Seed 100+ employees
2. Initiate payroll period
3. Measure calculation time
4. **Expected**: < 30 seconds for 100 employees

### Test 2: Concurrent Adjustments
1. Add manual adjustments to 10 payslips simultaneously
2. Verify all adjustments applied correctly
3. **Expected**: No data loss or conflicts

---

## Debug Endpoints

### 1. Check Employee Collection
```bash
GET http://localhost:3000/payroll-execution/debug/employees-data
```

### 2. View Run Employees
```bash
GET http://localhost:3000/payroll-execution/debug/run/PR-2025-DEC/employees
```

### 3. Check HR Events
```bash
POST http://localhost:3000/payroll-execution/events/check
Content-Type: application/json

{
  "employeeId": "<EMPLOYEE_ID>"
}
```

---

## Cleanup & Reset

### Clear All Test Data
```bash
POST http://localhost:3000/payroll-execution/seed/clear
```
**Use this to reset database before starting new tests**

---

## Common Issues & Troubleshooting

### Issue 1: "Payroll Run not found"
**Solution**: Verify runId format is correct (e.g., "PR-2025-DEC")

### Issue 2: "No employees found"
**Solution**: 
1. Run `GET /debug/employees-data` to check employee collection
2. Seed test data if empty

### Issue 3: "Anomaly detection blocked submission"
**Solution**: 
1. Check anomaly details in response
2. Fix issues (add bank details, adjust salaries)
3. Resubmit

### Issue 4: "Cannot execute - not approved"
**Solution**: 
1. Ensure manager approval completed
2. Ensure finance approval completed
3. Check status is "approved" before executing

---

## Success Criteria

✅ **Phase 0**: Benefits reviewed and approved  
✅ **Phase 1**: Period initiated and employees fetched  
✅ **Phase 1.2**: Calculations completed with tax/insurance applied  
✅ **Phase 2**: Anomaly detection passed  
✅ **Phase 3**: Manager and finance approvals obtained  
✅ **Phase 5**: Payslips generated and distributed  
✅ **Phase 6**: Payroll locked automatically  

---

## Next Steps

After manual testing, consider:
1. **Automated E2E Tests**: Create Jest tests for critical flows
2. **Load Testing**: Test with 500+ employees
3. **Integration Testing**: Test with real Time Management data
4. **Security Testing**: Test role-based access control

---

## Support

For issues or questions, contact the Payroll Execution Team.
