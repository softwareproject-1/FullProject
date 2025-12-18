Recruitment Subsystem Integration Plan
This plan outlines how to safely integrate your recruitment subsystem work from backend/src and frontend into the full HR project repo (Milestone2/HR-System-main and Milestone3).

User Review Required
CAUTION

Auth Module Conflict: Your auth.service.ts has additional features (OFF-007 access revocation check, improved ObjectId query support) that the Milestone2 version lacks. See Auth Integration Options below for recommended strategies.

IMPORTANT

Frontend Context Naming: Your frontend uses context/ folder while Milestone3 uses contexts/ folder. AuthContext files have different implementations.

Backend Analysis Summary
Files with Differences
File	backend/src	Milestone2/HR-System-main/src	Key Differences
auth/auth.service.ts	592 lines (21772 bytes)	577 lines (21129 bytes)	Your version has OFF-007 access revocation check (lines 398-412), improved getUserRoles with ObjectId/string dual query support
auth/auth.controller.ts	285 lines (9128 bytes)	272 lines (8567 bytes)	Your version includes access_token in login response (line 48), fallback roles logic in /me endpoint (lines 192-198)
auth/decorators/	2 files	3 files	Milestone2 has current-user.decorator.ts that you're missing
app.module.ts	MONGO_URI env var	DB_URL env var	Different environment variable names
recruitment/	56 children	56 children	Similar structure - need detailed file comparison
Auth Module Integration Options
WARNING

Choose ONE of these strategies:

Option A: Keep Milestone2 Auth + Add Your Enhancements (RECOMMENDED)

Keep Milestone2/HR-System-main/src/auth as the base
Add your OFF-007 access revocation logic (lines 398-412 from your auth.service.ts)
Add improved getUserRoles ObjectId support (your lines 503-510)
Add access_token in login response (your line 48 in auth.controller.ts)
Add fallback roles logic in /me endpoint (your lines 192-198)
Keep Milestone2's current-user.decorator.ts
Option B: Use Your Auth + Add Missing Decorator

Replace Milestone2/HR-System-main/src/auth with your backend/src/auth
Copy current-user.decorator.ts from Milestone2 to your auth
Option C: Manual Merge (Most Careful But Time-Consuming)

Line-by-line comparison and selective merging
Proposed Backend Changes
Auth Module
[MODIFY] 
auth.service.ts
If Option A chosen, add these enhancements:

Add OFF-007 Access Revocation Check (inside the else block after line 403):
// OFF-007: If a role exists but is inactive, access has been revoked
// Block login for terminated/offboarded employees
if (anyRole.isActive === false) {
  throw new UnauthorizedException('Your system access has been revoked. Please contact HR.');
}
Improve getUserRoles with ObjectId support (update the findOne query around line 491):
// Try with both ObjectId and string to handle any format
const systemRole = await this.employeeSystemRoleModel
  .findOne({
    $or: [
      { employeeProfileId: userId },
      { employeeProfileId: new Types.ObjectId(userId) }
    ],
    isActive: true,
  })
  .exec();
[MODIFY] 
auth.controller.ts
Add access_token to login response (around line 48):
return {
  statusCode: HttpStatus.OK,
  message: 'Login successful',
  access_token: result.access_token,  // ADD THIS LINE
  user: result.payload,
};
Add fallback roles logic in /me endpoint (replace lines 189-203):
// Use JWT roles as fallback if database lookup returns empty
const roles = freshRoles.roles && freshRoles.roles.length > 0
  ? freshRoles.roles
  : (req.user.roles || []);
const permissions = freshRoles.permissions && freshRoles.permissions.length > 0
  ? freshRoles.permissions
  : (req.user.permissions || []);
return {
  id: employeeProfile._id,
  // ... rest of response
  roles: roles,
  permissions: permissions,
  status: employeeProfile.status,
};
Recruitment Module
[COPY] recruitment/
After auth is resolved, compare and synchronize recruitment modules.

Since both have 56 children with similar structure, need to check if:

Any files were added/modified in your version
Any service logic differs
Proposed Frontend Changes (Milestone3)
App Directory Changes
Directory	Action	Notes
app/recruitment/	REPLACE	Your version is 256KB vs 15KB - significantly more functionality
app/candidate/	MERGE	Add missing: jobs/, offers/, onboarding/ subdirs
app/offboarding/	ADD NEW	12 children - entirely new feature
app/login/	ADD NEW	2 children - may be new
[REPLACE] 
app/recruitment/page.tsx
Replace with your comprehensive 
recruitment/page.tsx
 (256KB).

[MERGE] app/candidate/
Current Milestone3 has:

applications/
profile/
page.tsx
Your frontend has:

applications/
jobs/ ← ADD
offers/ ← ADD
onboarding/ ← ADD
profile/
page.tsx ← COMPARE/UPDATE
[NEW] app/offboarding/
Copy entire directory:

offboarding/
components/ (11 files)
page.tsx (62KB)
Shared Files Analysis
Components
File	frontend/components	Milestone3/components	Action
AccountProvisioningPanel.tsx	20KB	N/A	ADD
ApiTestComponent.tsx	2KB	N/A	ADD
EmployeeList.tsx	3KB	N/A	ADD
Sidebar.tsx	4.5KB	16KB	KEEP MILESTONE3 (larger)
Topbar.tsx	4.7KB	6KB	KEEP MILESTONE3 (larger)
RouteGuard.tsx	4.8KB	5KB	COMPARE
figma/	1 child	N/A	ADD
[ADD] New Components
Copy AccountProvisioningPanel.tsx, ApiTestComponent.tsx, EmployeeList.tsx from frontend/components to Milestone3/components
[COMPARE] RouteGuard.tsx
Your version: 4881 bytes vs Milestone3: 5075 bytes - slight difference, likely safe to keep Milestone3's version.

Context/Contexts
File	frontend/context	Milestone3/contexts	Size Diff
AuthContext.tsx	10882 bytes	10398 bytes	+484 bytes
IMPORTANT

Your AuthContext.tsx is slightly larger. Need to identify what additional logic you added.

Recommended Action
Compare the two files carefully. If your version has recruitment-specific features, merge them into the Milestone3 version.

Utils
File	frontend/utils	Milestone3/utils	Action
ApiClient.ts	5810 bytes	5820 bytes	Similar - keep Milestone3
roleAccess.ts	16188 bytes	22990 bytes	KEEP MILESTONE3 (more complete)
roleUtils.ts	3927 bytes	2673 bytes	MERGE - your version larger
authApi.ts	N/A	473 bytes	Keep Milestone3
candidateApi.ts	N/A	5375 bytes	Keep Milestone3
employeeProfileApi.ts	N/A	8039 bytes	Keep Milestone3
organizationStructureApi.ts	N/A	5976 bytes	Keep Milestone3
performanceApi.ts	N/A	3049 bytes	Keep Milestone3
Lib
File	frontend/lib	Milestone3/lib	Action
api.ts	16952 bytes	46809 bytes	KEEP MILESTONE3 (much larger, includes all subsystems)
axios.ts	5044 bytes	1542 bytes	MERGE - your version significantly larger
types.ts	19147 bytes	8258 bytes	MERGE - your version has more type definitions
[MERGE] lib/types.ts
Your types.ts is ~11KB larger - likely contains recruitment-specific types. Add your types to the Milestone3 file.

[MERGE] lib/axios.ts
Your axios.ts is ~3.5KB larger - likely contains additional axios configuration. Merge carefully.

Services
File	frontend/services	Milestone3/services	Action
api.ts	27799 bytes	21260 bytes	MERGE - add your recruitment API calls
[MERGE] services/api.ts
Your version is ~6.5KB larger. Add your recruitment-specific service calls to the Milestone3 version.

Step-by-Step Integration Order
Phase 1: Backend Integration
Choose auth strategy (Option A, B, or C above)
Apply chosen auth modifications to Milestone2/HR-System-main/src/auth
Verify recruitment module differences (if any)
Update app.module.ts environment variable if needed
Phase 2: Frontend Core Files
Merge lib/types.ts - add your recruitment types
Merge lib/axios.ts - add your configurations
Merge services/api.ts - add your API calls
Compare and update contexts/AuthContext.tsx if needed
Phase 3: Frontend App Pages
Replace app/recruitment/page.tsx
Add missing subdirs to app/candidate/
Add entire app/offboarding/ directory
Add app/login/ if missing
Phase 4: Frontend Components
Add new components: AccountProvisioningPanel.tsx, ApiTestComponent.tsx, EmployeeList.tsx
Add figma/ directory if needed
Merge roleUtils.ts differences
Verification Plan
Pre-Integration Verification
Make a backup/commit of current Milestone2 and Milestone3 state
Document current working state
Post-Integration Verification
Backend Tests
cd Milestone2/HR-System-main
npm run start:dev
Verify server starts without errors
Test login endpoint works
Test recruitment endpoints
Frontend Tests
cd Milestone3
npm run dev
Verify Next.js builds without errors
Navigate to recruitment page
Navigate to candidate portal
Test offboarding page (if applicable)
Manual Verification
Login with a test user
Access recruitment dashboard
Verify candidate can register and apply
Test offboarding workflow (if implemented)
Summary
Category	Files to Add	Files to Merge	Files to Replace
Backend Auth	0	2-3	0
Backend Recruitment	TBD	TBD	TBD
Frontend Pages	3+ dirs	1	1
Frontend Components	4	1	0
Frontend Lib	0	2	0
Frontend Services	0	1	0
Frontend Utils	0	1	0
Frontend Contexts	0	1	0
