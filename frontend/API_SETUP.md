# API Connection Setup - Milestone 3 Frontend to Milestone 2 Backend

## Overview
The frontend (Milestone3) is now connected to the backend (Milestone2) using Axios for API communication.

## Configuration

### Backend URL
- **Development**: `http://localhost:3001`
- Set in `.env.local` as `NEXT_PUBLIC_API_URL`

### Files Created

1. **lib/axios.ts** - Axios instance configuration
   - Base URL configuration
   - Request interceptor (adds JWT token automatically)
   - Response interceptor (handles errors and 401 redirects)
   - Timeout: 10 seconds

2. **services/api.ts** - API service functions
   - `authApi` - Authentication (login, register, profile)
   - `employeeProfileApi` - Employee CRUD operations
   - `timeManagementApi` - Shifts, attendance, holidays, exceptions
   - `leavesApi` - Leave requests management
   - `recruitmentApi` - Recruitment operations
   - `payrollConfigApi` - Payroll configuration
   - `payrollExecutionApi` - Payroll execution
   - `payrollTrackingApi` - Claims and disputes
   - `performanceApi` - Performance reviews
   - `organizationApi` - Departments and positions

3. **components/EmployeeList.tsx** - Example component showing API usage
   - Fetches employee data
   - Loading and error states
   - Retry functionality

## Usage Examples

### 1. Authentication
```typescript
import { authApi } from '@/services/api';

// Login
const response = await authApi.login('email@example.com', 'password');
localStorage.setItem('authToken', response.data.access_token);

// Get current user profile
const profile = await authApi.getProfile();

// Logout
authApi.logout();
```

### 2. Employee Profile
```typescript
import { employeeProfileApi } from '@/services/api';

// Get all employees
const employees = await employeeProfileApi.getAll();

// Get single employee
const employee = await employeeProfileApi.getById('employeeId');

// Create employee
const newEmployee = await employeeProfileApi.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});

// Update employee
await employeeProfileApi.update('employeeId', { firstName: 'Jane' });

// Delete employee
await employeeProfileApi.delete('employeeId');
```

### 3. Time Management
```typescript
import { timeManagementApi } from '@/services/api';

// Get shifts
const shifts = await timeManagementApi.getShifts();

// Record attendance
await timeManagementApi.createAttendance({
  employeeId: 'empId',
  date: new Date(),
  checkIn: '09:00',
  checkOut: '17:00'
});
```

### 4. Payroll Tracking
```typescript
import { payrollTrackingApi } from '@/services/api';

// Get employee payroll
const payroll = await payrollTrackingApi.getByEmployee('employeeId');

// Create claim
await payrollTrackingApi.createClaim({
  employeeId: 'empId',
  amount: 1000,
  reason: 'Overtime'
});

// Create dispute
await payrollTrackingApi.createDispute({
  employeeId: 'empId',
  issue: 'Incorrect calculation'
});
```

## Setting Up

### 1. Make sure backend is running
```bash
cd Milestone2/HR-System-main
npm install
npm run start:dev
```
Backend will run on `http://localhost:3001`

### 2. Start frontend
```bash
cd Milestone3
npm install
npm run dev
```
Frontend will run on `http://localhost:3000`

## Authentication Flow

1. User logs in via `authApi.login()`
2. JWT token is stored in localStorage
3. Axios interceptor automatically adds token to all requests
4. If token expires (401 error), user is redirected to login

## Error Handling

The axios instance automatically handles:
- **401 Unauthorized**: Clears token and redirects to login
- **403 Forbidden**: Logs error to console
- **404 Not Found**: Logs error to console
- **500 Server Error**: Logs error to console

## CORS Configuration

The backend already has CORS enabled in `main.ts`:
```typescript
app.enableCors({
  origin: true,
  credentials: true,
});
```

## Next Steps

1. Implement login page
2. Add authentication context/provider
3. Create forms for CRUD operations
4. Add loading states and error handling
5. Implement pagination for lists
6. Add form validation
