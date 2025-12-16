// Script to check employee roles in database
// Run with: npm run check-roles EMPLOYEE_NUMBER
// Or: npx ts-node scripts/check-employee-roles.ts EMPLOYEE_NUMBER

import mongoose from 'mongoose';

// MongoDB connection string - adjust if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-organization-performance';

// Get employee number from command line
const employeeNumber = process.argv[2] || 'ADMIN-00';

// Schema definitions (simplified)
const EmployeeProfileSchema = new mongoose.Schema({
  employeeNumber: String,
  firstName: String,
  lastName: String,
}, { collection: 'employeeprofiles' });

const EmployeeSystemRoleSchema = new mongoose.Schema({
  employeeProfileId: mongoose.Schema.Types.ObjectId,
  roles: [String],
  permissions: [String],
  isActive: Boolean,
}, { collection: 'employee_system_roles' });

const EmployeeProfile = mongoose.model('EmployeeProfile', EmployeeProfileSchema);
const EmployeeSystemRole = mongoose.model('EmployeeSystemRole', EmployeeSystemRoleSchema);

async function checkEmployeeRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find employee
    const employee = await EmployeeProfile.findOne({ employeeNumber: employeeNumber });
    
    if (!employee) {
      console.error(`❌ Employee with employeeNumber "${employeeNumber}" not found!`);
      process.exit(1);
    }

    console.log(`✓ Found employee: ${employee.firstName} ${employee.lastName}`);
    console.log(`  Employee Number: ${employee.employeeNumber}`);
    console.log(`  Employee ID: ${employee._id}\n`);

    // Find all system roles (active and inactive)
    const allRoles = await EmployeeSystemRole.find({
      employeeProfileId: employee._id,
    });

    console.log(`Found ${allRoles.length} system role document(s):\n`);

    allRoles.forEach((role, index) => {
      console.log(`--- Role Document ${index + 1} ---`);
      console.log(`  Document ID: ${role._id}`);
      console.log(`  Is Active: ${role.isActive}`);
      console.log(`  Roles:`, role.roles);
      console.log(`  Roles Type:`, typeof role.roles, Array.isArray(role.roles));
      console.log(`  Permissions:`, role.permissions);
      console.log(`  Created: ${(role as any).createdAt}`);
      console.log(`  Updated: ${(role as any).updatedAt}`);
      console.log('');
    });

    // Find active role (what login uses)
    const activeRole = await EmployeeSystemRole.findOne({
      employeeProfileId: employee._id,
      isActive: true,
    });

    if (activeRole) {
      console.log('=== ACTIVE ROLE (Used by Login) ===');
      console.log(`  Roles:`, activeRole.roles);
      console.log(`  Has "System Admin":`, activeRole.roles.includes('System Admin'));
      console.log(`  Has "department employee":`, activeRole.roles.includes('department employee'));
    } else {
      console.log('⚠️  No active role found!');
    }

    // Check if multiple active roles exist (shouldn't happen)
    const activeRoles = await EmployeeSystemRole.find({
      employeeProfileId: employee._id,
      isActive: true,
    });

    if (activeRoles.length > 1) {
      console.log(`\n⚠️  WARNING: Found ${activeRoles.length} active roles! This should not happen.`);
      console.log('   Only the first one will be used by login.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkEmployeeRoles();

