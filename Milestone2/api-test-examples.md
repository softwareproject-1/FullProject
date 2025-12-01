# API Test Examples

## Base URL
```
http://localhost:5000/api
```

---

## 1. Register User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "nationalId": "1234567890123",
  "password": "SecurePass123!",
  "personalEmail": "john.doe@example.com",
  "mobilePhone": "+1234567890",
  "employeeNumber": "EMP001",
  "dateOfHire": "2024-01-15T00:00:00.000Z",
  "workEmail": "john.doe@company.com"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "middleName": "Michael",
    "lastName": "Doe",
    "nationalId": "1234567890123",
    "password": "SecurePass123!",
    "personalEmail": "john.doe@example.com",
    "mobilePhone": "+1234567890",
    "employeeNumber": "EMP001",
    "dateOfHire": "2024-01-15T00:00:00.000Z",
    "workEmail": "john.doe@company.com"
  }'
```

---

## 2. Login

**Endpoint:** `POST /api/auth/login`

**Request Body (using National ID):**
```json
{
  "nationalId": "1234567890123",
  "password": "SecurePass123!"
}
```

**Request Body (using Work Email):**
```json
{
  "workEmail": "john.doe@company.com",
  "password": "SecurePass123!"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890123",
    "password": "SecurePass123!"
  }'
```

---

## 3. Create Performance Template

**Endpoint:** `POST /api/performance/templates`

**Request Body:**
```json
{
  "name": "Annual Performance Review Template 2024",
  "description": "Comprehensive annual performance evaluation template for all employees",
  "templateType": "ANNUAL",
  "ratingScale": {
    "type": "FIVE_POINT",
    "min": 1,
    "max": 5,
    "step": 1,
    "labels": [
      "Needs Improvement",
      "Below Expectations",
      "Meets Expectations",
      "Exceeds Expectations",
      "Outstanding"
    ]
  },
  "criteria": [
    {
      "key": "job_knowledge",
      "title": "Job Knowledge",
      "details": "Demonstrates understanding of job requirements and responsibilities",
      "weight": 20,
      "maxScore": 5,
      "required": true
    },
    {
      "key": "quality_of_work",
      "title": "Quality of Work",
      "details": "Accuracy, thoroughness, and attention to detail in work output",
      "weight": 25,
      "maxScore": 5,
      "required": true
    },
    {
      "key": "productivity",
      "title": "Productivity",
      "details": "Efficiency and volume of work completed within deadlines",
      "weight": 20,
      "maxScore": 5,
      "required": true
    },
    {
      "key": "communication",
      "title": "Communication Skills",
      "details": "Effectiveness in verbal and written communication",
      "weight": 15,
      "maxScore": 5,
      "required": true
    },
    {
      "key": "teamwork",
      "title": "Teamwork & Collaboration",
      "details": "Ability to work effectively with colleagues and contribute to team goals",
      "weight": 20,
      "maxScore": 5,
      "required": true
    }
  ],
  "instructions": "Please rate each criterion on a scale of 1-5. Provide specific examples to support your ratings.",
  "isActive": true
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/performance/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Performance Review Template 2024",
    "description": "Comprehensive annual performance evaluation template for all employees",
    "templateType": "ANNUAL",
    "ratingScale": {
      "type": "FIVE_POINT",
      "min": 1,
      "max": 5,
      "step": 1,
      "labels": [
        "Needs Improvement",
        "Below Expectations",
        "Meets Expectations",
        "Exceeds Expectations",
        "Outstanding"
      ]
    },
    "criteria": [
      {
        "key": "job_knowledge",
        "title": "Job Knowledge",
        "details": "Demonstrates understanding of job requirements and responsibilities",
        "weight": 20,
        "maxScore": 5,
        "required": true
      },
      {
        "key": "quality_of_work",
        "title": "Quality of Work",
        "details": "Accuracy, thoroughness, and attention to detail in work output",
        "weight": 25,
        "maxScore": 5,
        "required": true
      },
      {
        "key": "productivity",
        "title": "Productivity",
        "details": "Efficiency and volume of work completed within deadlines",
        "weight": 20,
        "maxScore": 5,
        "required": true
      },
      {
        "key": "communication",
        "title": "Communication Skills",
        "details": "Effectiveness in verbal and written communication",
        "weight": 15,
        "maxScore": 5,
        "required": true
      },
      {
        "key": "teamwork",
        "title": "Teamwork & Collaboration",
        "details": "Ability to work effectively with colleagues and contribute to team goals",
        "weight": 20,
        "maxScore": 5,
        "required": true
      }
    ],
    "instructions": "Please rate each criterion on a scale of 1-5. Provide specific examples to support your ratings.",
    "isActive": true
  }'
```

---

## 4. Get All Templates

**Endpoint:** `GET /api/performance/templates`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/templates
```

---

## 5. Get Template by ID

**Endpoint:** `GET /api/performance/templates/{templateId}`

**cURL Command:**
```bash
# Replace {templateId} with the actual template ID from the create response
curl -X GET http://localhost:5000/api/performance/templates/{templateId}
```

**Example:**
```bash
curl -X GET http://localhost:5000/api/performance/templates/65f1234567890abcdef12345
```

---

## 6. Update Template

**Endpoint:** `PATCH /api/performance/templates/{templateId}`

**Request Body:**
```json
{
  "name": "Updated Annual Performance Review Template 2024",
  "description": "Updated description",
  "isActive": false
}
```

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/templates/{templateId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Annual Performance Review Template 2024",
    "description": "Updated description",
    "isActive": false
  }'
```

---

## 7. Delete Template

**Endpoint:** `PATCH /api/performance/templates/{templateId}/delete`

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/templates/{templateId}/delete
```

---

## 8. Create Appraisal Cycle

**Endpoint:** `POST /api/performance/cycles`

**Request Body:**
```json
{
  "name": "Q1 2024 Performance Review Cycle",
  "description": "First quarter performance evaluation cycle for 2024",
  "cycleType": "ANNUAL",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-03-31T23:59:59.000Z",
  "managerDueDate": "2024-03-15T23:59:59.000Z",
  "employeeAcknowledgementDueDate": "2024-03-25T23:59:59.000Z",
  "templateAssignments": [
    {
      "templateId": "{templateId}",
      "departmentIds": ["{departmentId1}", "{departmentId2}"]
    }
  ],
  "status": "PLANNED"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/performance/cycles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2024 Performance Review Cycle",
    "description": "First quarter performance evaluation cycle for 2024",
    "cycleType": "ANNUAL",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-03-31T23:59:59.000Z",
    "managerDueDate": "2024-03-15T23:59:59.000Z",
    "employeeAcknowledgementDueDate": "2024-03-25T23:59:59.000Z",
    "templateAssignments": [
      {
        "templateId": "{templateId}",
        "departmentIds": ["{departmentId1}", "{departmentId2}"]
      }
    ],
    "status": "PLANNED"
  }'
```

---

## 9. Get All Cycles

**Endpoint:** `GET /api/performance/cycles`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/cycles
```

---

## 10. Get Cycle by ID

**Endpoint:** `GET /api/performance/cycles/{cycleId}`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/cycles/{cycleId}
```

---

## 11. Update Cycle

**Endpoint:** `PATCH /api/performance/cycles/{cycleId}`

**Request Body:**
```json
{
  "name": "Updated Q1 2024 Performance Review Cycle",
  "description": "Updated description",
  "managerDueDate": "2024-03-20T23:59:59.000Z"
}
```

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/cycles/{cycleId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Q1 2024 Performance Review Cycle",
    "description": "Updated description",
    "managerDueDate": "2024-03-20T23:59:59.000Z"
  }'
```

---

## 12. Set Cycle Status

**Endpoint:** `PATCH /api/performance/cycles/{cycleId}/status/{status}`

**Status Values:** `PLANNED`, `ACTIVE`, `CLOSED`, `ARCHIVED`

**cURL Command:**
```bash
# Activate a cycle
curl -X PATCH http://localhost:5000/api/performance/cycles/{cycleId}/status/ACTIVE

# Close a cycle
curl -X PATCH http://localhost:5000/api/performance/cycles/{cycleId}/status/CLOSED
```

---

## 13. Archive Cycle

**Endpoint:** `PATCH /api/performance/cycles/{cycleId}/archive`

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/cycles/{cycleId}/archive
```

---

## 14. Delete Cycle

**Endpoint:** `PATCH /api/performance/cycles/{cycleId}/delete`

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/cycles/{cycleId}/delete
```

---

## 15. Create Appraisal Assignments

**Endpoint:** `POST /api/performance/assignments`

**Request Body:**
```json
{
  "cycleId": "{cycleId}",
  "templateId": "{templateId}",
  "assignments": [
    {
      "employeeProfileId": "{employeeProfileId1}",
      "managerProfileId": "{managerProfileId1}",
      "departmentId": "{departmentId}",
      "positionId": "{positionId}",
      "dueDate": "2024-03-15T23:59:59.000Z"
    },
    {
      "employeeProfileId": "{employeeProfileId2}",
      "managerProfileId": "{managerProfileId2}",
      "departmentId": "{departmentId}",
      "positionId": "{positionId}",
      "dueDate": "2024-03-15T23:59:59.000Z"
    }
  ]
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/performance/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "cycleId": "{cycleId}",
    "templateId": "{templateId}",
    "assignments": [
      {
        "employeeProfileId": "{employeeProfileId1}",
        "managerProfileId": "{managerProfileId1}",
        "departmentId": "{departmentId}",
        "positionId": "{positionId}",
        "dueDate": "2024-03-15T23:59:59.000Z"
      },
      {
        "employeeProfileId": "{employeeProfileId2}",
        "managerProfileId": "{managerProfileId2}",
        "departmentId": "{departmentId}",
        "positionId": "{positionId}",
        "dueDate": "2024-03-15T23:59:59.000Z"
      }
    ]
  }'
```

---

## 16. Get Assignments by Cycle

**Endpoint:** `GET /api/performance/cycles/{cycleId}/assignments`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/cycles/{cycleId}/assignments
```

---

## 17. Get Assignment by ID

**Endpoint:** `GET /api/performance/assignments/{assignmentId}`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/assignments/{assignmentId}
```

---

## 18. Delete Assignment

**Endpoint:** `PATCH /api/performance/assignments/{assignmentId}/delete`

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/assignments/{assignmentId}/delete
```

---

## 19. Create or Update Appraisal Record

**Endpoint:** `POST /api/performance/assignments/{assignmentId}/records`

**Request Body:**
```json
{
  "assignmentId": "{assignmentId}",
  "cycleId": "{cycleId}",
  "templateId": "{templateId}",
  "employeeProfileId": "{employeeProfileId}",
  "managerProfileId": "{managerProfileId}",
  "ratings": [
    {
      "key": "job_knowledge",
      "title": "Job Knowledge",
      "ratingValue": 4,
      "ratingLabel": "Exceeds Expectations",
      "weightedScore": 0.8,
      "comments": "Excellent understanding of job requirements and consistently applies knowledge effectively."
    },
    {
      "key": "quality_of_work",
      "title": "Quality of Work",
      "ratingValue": 5,
      "ratingLabel": "Outstanding",
      "weightedScore": 1.25,
      "comments": "Work quality is consistently exceptional with attention to detail."
    },
    {
      "key": "productivity",
      "title": "Productivity",
      "ratingValue": 4,
      "ratingLabel": "Exceeds Expectations",
      "weightedScore": 0.8,
      "comments": "Consistently meets and often exceeds productivity targets."
    },
    {
      "key": "communication",
      "title": "Communication Skills",
      "ratingValue": 4,
      "ratingLabel": "Exceeds Expectations",
      "weightedScore": 0.6,
      "comments": "Clear and effective communication with team members and stakeholders."
    },
    {
      "key": "teamwork",
      "title": "Teamwork & Collaboration",
      "ratingValue": 5,
      "ratingLabel": "Outstanding",
      "weightedScore": 1.0,
      "comments": "Exceptional team player who contributes significantly to team success."
    }
  ],
  "totalScore": 4.45,
  "overallRatingLabel": "Exceeds Expectations",
  "managerSummary": "Overall excellent performance with strong contributions across all areas.",
  "strengths": "Strong technical skills, excellent teamwork, and consistent high-quality work output.",
  "improvementAreas": "Could benefit from taking on more leadership opportunities in cross-functional projects.",
  "managerSubmittedAt": "2024-03-15T10:30:00.000Z"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/performance/assignments/{assignmentId}/records \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "{assignmentId}",
    "cycleId": "{cycleId}",
    "templateId": "{templateId}",
    "employeeProfileId": "{employeeProfileId}",
    "managerProfileId": "{managerProfileId}",
    "ratings": [
      {
        "key": "job_knowledge",
        "title": "Job Knowledge",
        "ratingValue": 4,
        "ratingLabel": "Exceeds Expectations",
        "weightedScore": 0.8,
        "comments": "Excellent understanding of job requirements and consistently applies knowledge effectively."
      },
      {
        "key": "quality_of_work",
        "title": "Quality of Work",
        "ratingValue": 5,
        "ratingLabel": "Outstanding",
        "weightedScore": 1.25,
        "comments": "Work quality is consistently exceptional with attention to detail."
      },
      {
        "key": "productivity",
        "title": "Productivity",
        "ratingValue": 4,
        "ratingLabel": "Exceeds Expectations",
        "weightedScore": 0.8,
        "comments": "Consistently meets and often exceeds productivity targets."
      },
      {
        "key": "communication",
        "title": "Communication Skills",
        "ratingValue": 4,
        "ratingLabel": "Exceeds Expectations",
        "weightedScore": 0.6,
        "comments": "Clear and effective communication with team members and stakeholders."
      },
      {
        "key": "teamwork",
        "title": "Teamwork & Collaboration",
        "ratingValue": 5,
        "ratingLabel": "Outstanding",
        "weightedScore": 1.0,
        "comments": "Exceptional team player who contributes significantly to team success."
      }
    ],
    "totalScore": 4.45,
    "overallRatingLabel": "Exceeds Expectations",
    "managerSummary": "Overall excellent performance with strong contributions across all areas.",
    "strengths": "Strong technical skills, excellent teamwork, and consistent high-quality work output.",
    "improvementAreas": "Could benefit from taking on more leadership opportunities in cross-functional projects.",
    "managerSubmittedAt": "2024-03-15T10:30:00.000Z"
  }'
```

---

## 20. Get Records by Cycle

**Endpoint:** `GET /api/performance/cycles/{cycleId}/records`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/cycles/{cycleId}/records
```

---

## 21. Get Record by ID

**Endpoint:** `GET /api/performance/records/{recordId}`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/records/{recordId}
```

---

## 22. Publish Appraisal Record

**Endpoint:** `PATCH /api/performance/records/{recordId}/publish`

**Request Body:**
```json
{
  "hrPublisherEmployeeId": "{hrEmployeeId}",
  "summaryComment": "Record reviewed and approved for publication."
}
```

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/records/{recordId}/publish \
  -H "Content-Type: application/json" \
  -d '{
    "hrPublisherEmployeeId": "{hrEmployeeId}",
    "summaryComment": "Record reviewed and approved for publication."
  }'
```

---

## 23. Acknowledge Appraisal Record

**Endpoint:** `PATCH /api/performance/records/{recordId}/acknowledge`

**Request Body:**
```json
{
  "employeeId": "{employeeProfileId}",
  "acknowledgementComment": "I acknowledge receipt of this performance review and understand the feedback provided."
}
```

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/records/{recordId}/acknowledge \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "{employeeProfileId}",
    "acknowledgementComment": "I acknowledge receipt of this performance review and understand the feedback provided."
  }'
```

---

## 24. Delete Record

**Endpoint:** `PATCH /api/performance/records/{recordId}/delete`

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/records/{recordId}/delete
```

---

## 25. Create Appraisal Dispute

**Endpoint:** `POST /api/performance/disputes`

**Request Body:**
```json
{
  "appraisalId": "{recordId}",
  "assignmentId": "{assignmentId}",
  "cycleId": "{cycleId}",
  "raisedByEmployeeId": "{employeeProfileId}",
  "reason": "Disagreement with rating on quality of work",
  "details": "I believe my rating for quality of work should be higher based on the projects I completed this quarter. I have documentation showing exceptional work quality."
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:5000/api/performance/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "appraisalId": "{recordId}",
    "assignmentId": "{assignmentId}",
    "cycleId": "{cycleId}",
    "raisedByEmployeeId": "{employeeProfileId}",
    "reason": "Disagreement with rating on quality of work",
    "details": "I believe my rating for quality of work should be higher based on the projects I completed this quarter. I have documentation showing exceptional work quality."
  }'
```

---

## 26. Get Disputes by Cycle

**Endpoint:** `GET /api/performance/cycles/{cycleId}/disputes`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/cycles/{cycleId}/disputes
```

---

## 27. Get Dispute by ID

**Endpoint:** `GET /api/performance/disputes/{disputeId}`

**cURL Command:**
```bash
curl -X GET http://localhost:5000/api/performance/disputes/{disputeId}
```

---

## 28. Resolve Appraisal Dispute

**Endpoint:** `PATCH /api/performance/disputes/{disputeId}/resolve`

**Request Body:**
```json
{
  "status": "ADJUSTED",
  "resolvedByEmployeeId": "{hrEmployeeId}",
  "resolutionSummary": "After review, the rating has been adjusted from 3 to 4 based on additional documentation provided by the employee."
}
```

**Status Values:** `OPEN`, `UNDER_REVIEW`, `ADJUSTED`, `REJECTED`

**cURL Command:**
```bash
curl -X PATCH http://localhost:5000/api/performance/disputes/{disputeId}/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ADJUSTED",
    "resolvedByEmployeeId": "{hrEmployeeId}",
    "resolutionSummary": "After review, the rating has been adjusted from 3 to 4 based on additional documentation provided by the employee."
  }'
```

---

## Notes

- Make sure your server is running on port 5000 (or adjust the port in the URLs)
- Replace all placeholder values like `{templateId}`, `{cycleId}`, `{assignmentId}`, etc. with actual IDs from previous responses
- All dates should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Password must be at least 6 characters long
- **Template types:** `ANNUAL`, `SEMI_ANNUAL`, `PROBATIONARY`, `PROJECT`, `AD_HOC`
- **Rating scale types:** `THREE_POINT`, `FIVE_POINT`, `TEN_POINT`
- **Cycle status values:** `PLANNED`, `ACTIVE`, `CLOSED`, `ARCHIVED`
- **Dispute status values:** `OPEN`, `UNDER_REVIEW`, `ADJUSTED`, `REJECTED`
- **Assignment status values:** `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `PUBLISHED`, `ACKNOWLEDGED`
- **Record status values:** `DRAFT`, `MANAGER_SUBMITTED`, `HR_PUBLISHED`, `ARCHIVED`

## Testing Workflow

1. **Register/Login** - Get authentication token (if required)
2. **Create Template** - Create a performance template
3. **Get Template** - Verify template was created
4. **Create Cycle** - Create an appraisal cycle using the template
5. **Create Assignments** - Assign employees to the cycle
6. **Create Records** - Managers create performance records
7. **Publish Records** - HR publishes the records
8. **Acknowledge Records** - Employees acknowledge their reviews
9. **Create Disputes** (if needed) - Employees can dispute ratings
10. **Resolve Disputes** - HR resolves disputes

