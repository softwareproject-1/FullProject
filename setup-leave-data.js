// Setup test data for Fares's payslip
// Payslip ID: 69420dde8da8bf5853bda2ec

// === STEP 1: Get Employee Info from Payslip ===
const payslip = db.payslips.findOne({ _id: ObjectId("69420dde8da8bf5853bda2ec") });
print("\n📋 PAYSLIP INFO:");
print("Month:", payslip.month, payslip.year);
print("Gross Salary:", payslip.totalGrossSalary);

const employee = db.employeeprofiles.findOne({ _id: payslip.employeeId });
print("\n👤 EMPLOYEE INFO:");
print("ID:", employee._id.toString());
print("Name:", employee.firstName, employee.lastName);
print("Email:", employee.email);
print("Base Salary:", employee.baseSalary);

// Save for next steps
const employeeId = employee._id;
const baseSalary = employee.baseSalary;

// === STEP 2: Create Unpaid Leave Type (if needed) ===
let unpaidLeaveType = db.leavetypes.findOne({ paid: false });
if (!unpaidLeaveType) {
    const category = db.leavecategories.findOne();
    if (!category) {
        print("\n⚠️  No leave category found, creating one...");
        db.leavecategories.insertOne({
            name: "Standard Leave",
            description: "Standard leave category",
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const cat = db.leavecategories.findOne();
    db.leavetypes.insertOne({
        code: "UNPAID",
        name: "Unpaid Leave",
        categoryId: cat._id,
        paid: false,
        deductible: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    unpaidLeaveType = db.leavetypes.findOne({ code: "UNPAID" });
    print("\n✅ Created unpaid leave type");
} else {
    print("\n✅ Unpaid leave type already exists");
}

// === STEP 3: Create Unpaid Leave Request ===
const existingLeave = db.leaverequests.findOne({
    employeeId: employeeId,
    "dates.from": new Date("2024-12-15")
});

if (!existingLeave) {
    db.leaverequests.insertOne({
        employeeId: employeeId,
        leaveTypeId: unpaidLeaveType._id,
        dates: {
            from: new Date("2024-12-15"),
            to: new Date("2024-12-17")
        },
        durationDays: 3,
        justification: "Testing unpaid leave deduction",
        status: "APPROVED",
        approvalFlow: [],
        irregularPatternFlag: false,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    print("✅ Created unpaid leave request (3 days)");
} else {
    print("✅ Unpaid leave request already exists");
}

// === STEP 4: Create Annual Leave Type (if needed) ===
let annualLeaveType = db.leavetypes.findOne({ code: "ANNUAL" });
if (!annualLeaveType) {
    const category = db.leavecategories.findOne();
    db.leavetypes.insertOne({
        code: "ANNUAL",
        name: "Annual Leave",
        categoryId: category._id,
        paid: true,
        deductible: false,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    annualLeaveType = db.leavetypes.findOne({ code: "ANNUAL" });
    print("✅ Created annual leave type");
} else {
    print("✅ Annual leave type already exists");
}

// === STEP 5: Create Leave Entitlement ===
const existingEntitlement = db.leaveentitlements.findOne({
    employeeId: employeeId,
    leaveTypeId: annualLeaveType._id
});

if (!existingEntitlement) {
    db.leaveentitlements.insertOne({
        employeeId: employeeId,
        leaveTypeId: annualLeaveType._id,
        yearlyEntitlement: 21,
        accruedActual: 21,
        accruedRounded: 21,
        carryForward: 0,
        taken: 16,
        pending: 0,
        remaining: 5,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    print("✅ Created leave entitlement (5 days remaining for encashment)");
} else {
    print("✅ Leave entitlement already exists");
}

// === STEP 6: Create December Payslip (for encashment test) ===
const decemberPayslip = db.payslips.findOne({
    employeeId: employeeId,
    monthNumber: 12,
    year: 2024
});

let decemberPayslipId;
if (!decemberPayslip) {
    const decResult = db.payslips.insertOne({
        employeeId: employeeId,
        month: "December",
        year: 2024,
        monthNumber: 12,
        totalGrossSalary: baseSalary,
        baseSalary: baseSalary,
        taxableIncome: baseSalary,
        totalDeductions: 5100,
        netSalary: baseSalary - 5100,
        status: "APPROVED",
        earningsDetails: { allowances: [], bonuses: [] },
        deductionsDetails: { taxes: [], insurances: [] },
        createdAt: new Date("2024-12-25"),
        updatedAt: new Date("2024-12-25")
    });
    decemberPayslipId = decResult.insertedId.toString();
    print("✅ Created December payslip");
} else {
    decemberPayslipId = decemberPayslip._id.toString();
    print("✅ December payslip already exists");
}

print("\n🎉 ALL DONE! Test data created successfully!");
print("\n📊 View payslips at:");
print("1. Current payslip (with unpaid leave):");
print("   http://localhost:3001/payroll/payroll-tracking/payslips/69420dde8da8bf5853bda2ec");
print("\n2. December payslip (with leave encashment):");
print("   http://localhost:3001/payroll/payroll-tracking/payslips/" + decemberPayslipId);
print("\n🔄 Hard refresh the pages (Cmd+Shift+R) to see the new data!");
print("\n✨ What you should see:");
print("   - Unpaid leave deduction: ~" + Math.round((baseSalary / 30) * 3) + " EGP (3 days)");
print("   - Leave encashment (Dec only): ~" + Math.round((baseSalary / 30) * 5) + " EGP (5 days)");
