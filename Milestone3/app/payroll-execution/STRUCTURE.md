# Payroll Execution - Structure Guide

## 📂 File Organization

```
app/payroll-execution/
├── page.tsx                      # Main Pre-Run Review page
├── StartPayrollCycleModal.tsx    # Modal component (moved here as requested)
└── draft/
    └── page.tsx                  # Draft payroll review page
```

## 🎯 What Each File Does

### 1. **page.tsx** (Pre-Run Review Dashboard)
**Purpose:** Phase 0 - Review pending benefits before starting payroll cycle

**Features:**
- View pending signing bonuses and terminations in tabs
- Approve/Reject/Edit benefit amounts
- Start new payroll cycle when all items reviewed
- Shows summary cards (pending count, total amount, readiness)

**Backend Integration:**
- `GET /payroll-execution/benefits/pending` - Load pending items
- `PATCH /payroll-execution/benefits/review` - Approve/Reject
- `POST /payroll-execution/period` - Start payroll cycle

---

### 2. **StartPayrollCycleModal.tsx** (Modal Component)
**Purpose:** Initiate a new payroll calculation cycle

**Features:**
- Auto-calculates current period (YYYY-MM format)
- Allows manual period editing (REQ-PY-26)
- Shows "What happens next" preview
- Triggers payroll cycle initiation

**Why in payroll-execution folder?**
- User requested it here instead of components/
- Keeps all payroll execution logic together
- Easier to find and maintain

---

### 3. **draft/page.tsx** (Draft Review - Next Phase)
**Purpose:** Phase 1 - Review generated payroll calculations

**What it will show:**
- All calculated employee salaries
- Deductions applied (tax, insurance, penalties)
- Bonuses included (signing, performance)
- Allowances (overtime, reimbursements)
- Manual adjustment options
- Submit for manager approval button

**Backend Endpoints (to be implemented):**
- `GET /payroll-execution/drafts/{runId}/employees` - Get all draft payslips
- `POST /payroll-execution/runs/{runId}/calculate` - Recalculate if needed
- `PATCH /payroll-execution/payslips/{id}/adjust` - Add manual adjustments

**Currently:** Placeholder page with "Coming Soon" message

---

## 🔗 API Integration

### Main API File: `services/api.ts`

**Why use services/api.ts instead of separate file?**
- Project already has centralized API file
- All subsystems use same pattern (see payrollTrackingApi, performanceApi, etc.)
- Easier to maintain and consistent with existing code

### Payroll Execution API Functions:

```typescript
payrollExecutionApi = {
  // Phase 0: Pre-Run
  getPendingBenefits()           // Get signing bonuses & terminations
  reviewBenefit(data)            // Approve/Reject benefits
  checkHrEvent(data)             // Check employee HR events
  
  // Phase 1: Period & Draft
  initiatePeriod(data)           // Start new payroll cycle
  reviewPeriod(data)             // Approve/Reject period
  getDraftEmployees(runId)       // Get draft payslips
  
  // Phase 1.1B: Calculations
  processRunCalculations(runId)  // Calculate salaries
  addManualAdjustment(id, data)  // Add manual adjustments
  getRunPayslips(runId)          // Get all payslips for run
  
  // Phase 2-3: Approvals
  submitForApproval(runId)       // Submit to manager
  managerReview(runId, data)     // Manager approve/reject
  financeReview(runId, data)     // Finance final approval
  getPayrollPreview(runId)       // Preview dashboard
  
  // Phase 5: Execution
  executeAndDistribute(runId)    // Execute payment & send payslips
  
  // Management
  lockPayroll(runId)             // Lock/freeze payroll
  unfreezePayroll(runId, data)   // Unfreeze if needed
  getPayslipDetails(empId, runId) // Get employee payslip details
  
  // Testing
  seedTestBenefits()             // Create test data
  clearTestData()                // Clear test data
}
```

---

## 🔄 Workflow

```
1. Pre-Run Review (page.tsx)
   ↓ Review all benefits
   ↓ Click "Start Payroll Cycle"
   ↓
2. Modal Opens (StartPayrollCycleModal.tsx)
   ↓ Confirm period
   ↓ Click "Calculate & Generate Draft"
   ↓
3. Draft Review (draft/page.tsx) ← YOU ARE HERE
   ↓ Review calculations
   ↓ Make adjustments
   ↓ Submit for approval
   ↓
4. Manager Review
   ↓ Approve/Reject
   ↓
5. Finance Review
   ↓ Final approval
   ↓
6. Execute & Distribute
   ↓ Payment processing
   ↓ Payslip distribution
```

---

## 🚀 Next Steps for Draft Page

1. **Fetch draft data:**
   ```typescript
   const draftData = await payrollExecutionApi.getDraftEmployees(runId);
   ```

2. **Display data table with:**
   - Employee name & ID
   - Base salary
   - Bonuses (signing, performance)
   - Allowances (overtime)
   - Deductions (tax, insurance, penalties, unpaid leave)
   - Net pay

3. **Add action buttons:**
   - Edit/Adjust salary
   - Recalculate
   - Submit for approval

4. **Anomaly detection:**
   - Negative salary warnings
   - Missing bank details
   - Salary spikes
   - Minimum wage violations

---

## 📝 Notes

- **No Mock Data:** All data comes from real backend
- **Real-time Updates:** Actions trigger immediate backend calls
- **Type Safety:** Full TypeScript with proper interfaces
- **Error Handling:** Toast notifications for success/errors
- **Loading States:** Spinners during API calls
- **Backend Ready:** All endpoints match your Milestone2 controller
