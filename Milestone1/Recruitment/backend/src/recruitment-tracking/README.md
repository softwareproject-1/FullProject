# Recruitment Tracking Module

This module consolidates all recruitment, onboarding, and offboarding functionality into a single, organized structure.

## Directory Structure

```
recruitment-tracking/
├── schemas/           # All database schemas (15 files)
├── controllers/       # All API controllers (11 files)
├── services/         # All business logic services (14 files)
├── dto/              # All Data Transfer Objects (17 files)
├── repositories/     # All data access repositories (7 files)
├── templates/        # Reusable templates for processes (4 files)
├── workflows/        # Workflow definitions (3 files)
└── recruitment-tracking.module.ts
```

## Consolidated Components

### Schemas (15)
- **Recruitment**: application, assessment-form, candidate, hiring-process-template, interview, job-posting, job-template, offer
- **Onboarding**: equipment-allocation, onboarding-checklist, onboarding-document, onboarding-plan
- **Offboarding**: clearance-task, exit-settlement, offboarding-plan

### Controllers (11)
- **Recruitment**: application, candidate, interview, job-requisition, offer
- **Onboarding**: document, onboarding-plan, onboarding-task
- **Offboarding**: clearance, offboarding-plan, settlement

### Services (14)
- **Recruitment**: application, candidate, interview, job-requisition, offer, recruitment-analytics
- **Onboarding**: document, onboarding-plan, onboarding-task, provisioning
- **Offboarding**: access-revocation, clearance, offboarding-plan, settlement

### DTOs (17)
- **Recruitment**: create-application, update-application-status, create-candidate, update-candidate, create-job-requisition, update-job-requisition, query-job-requisition, schedule-interview, interview-feedback, create-offer, accept-offer
- **Onboarding**: create-onboarding-plan, create-task, upload-document
- **Offboarding**: initiate-offboarding, clearance-signoff, final-settlement

### Repositories (7)
- **Recruitment**: application, candidate, interview, job-requisition
- **Onboarding**: onboarding-plan, onboarding-task
- **Offboarding**: offboarding-plan

### Templates (4)
- **Recruitment**: hiring-process, job-description
- **Onboarding**: default-checklist, provisioning-tasks

### Workflows (3)
- **Offboarding**: facilities-clearance, finance-clearance, it-clearance

## Migration Notes

The following folders have been consolidated into `recruitment-tracking`:
- `src/recruitment/` → Merged into `recruitment-tracking/`
- `src/onboarding/` → Merged into `recruitment-tracking/`
- `src/offboarding/` → Merged into `recruitment-tracking/`

## Module Configuration

The `recruitment-tracking.module.ts` file is ready to be configured once the actual implementations are complete. Currently, all imports are commented out as the files contain placeholder content.

### To Activate the Module:
1. Implement the actual classes in controllers, services, repositories, and schemas
2. Uncomment the relevant imports in `recruitment-tracking.module.ts`
3. Add the implemented components to the module's `controllers`, `providers`, and `exports` arrays

## Next Steps

1. ✅ Directory structure created
2. ✅ Files consolidated from three modules
3. ✅ Module file created with proper imports (commented out)
4. ✅ App module updated to import RecruitmentTrackingModule
5. 🔲 Implement actual classes in schema files
6. 🔲 Implement actual classes in controller files
7. 🔲 Implement actual classes in service files
8. 🔲 Implement actual classes in repository files
9. 🔲 Uncomment and configure module imports
10. 🔲 Test the consolidated module
