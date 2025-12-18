# Quick Start Guide - Connecting Frontend to Backend

## ✅ Setup Complete!

Your Milestone 3 frontend is now configured to connect to the Milestone 2 backend using Axios.

## 🚀 Running Both Applications

### Step 1: Start the Backend (Terminal 1)
```bash
cd Milestone2/HR-System-main
npm install  # If not already installed
npm run start:dev
```
✅ Backend will run on: **http://localhost:3001**

### Step 2: Start the Frontend (Terminal 2)
```bash
cd Milestone3
npm install  # If not already installed
npm run dev
```
✅ Frontend will run on: **http://localhost:3000**

## 🧪 Testing the Connection

1. Open your browser to **http://localhost:3000**
2. On the dashboard, you'll see an **API Connection Test** component
3. Click the **"Test Connection"** button
4. If successful, you'll see: ✅ Connection successful!

## 📁 Important Files Created

### Configuration
- **`.env.local`** - Environment variables (API URL)
- **`lib/axios.ts`** - Axios configuration with interceptors
- **`services/api.ts`** - All API endpoint functions

### Components
- **`components/ApiTestComponent.tsx`** - Test API connection
- **`components/EmployeeList.tsx`** - Example: Fetch and display employees

### Documentation
- **`API_SETUP.md`** - Complete API documentation

## 🔌 Available API Services

All services are imported from `@/services/api`:

```typescript
import { 
  authApi,           // Authentication
  employeeProfileApi, // Employee management
  timeManagementApi,  // Time tracking
  leavesApi,          // Leave requests
  recruitmentApi,     // Recruitment
  payrollConfigApi,   // Payroll config
  payrollExecutionApi,// Payroll execution
  payrollTrackingApi, // Claims & disputes
  performanceApi,     // Performance reviews
  organizationApi     // Org structure
} from '@/services/api';
```

## 📝 Example Usage

### Fetch Employees
```typescript
import { employeeProfileApi } from '@/services/api';

const response = await employeeProfileApi.getAll();
console.log(response.data);
```

### Login
```typescript
import { authApi } from '@/services/api';

const response = await authApi.login('email@example.com', 'password');
localStorage.setItem('authToken', response.data.access_token);
```

### Create Leave Request
```typescript
import { leavesApi } from '@/services/api';

await leavesApi.create({
  employeeId: 'empId',
  startDate: '2024-01-01',
  endDate: '2024-01-05',
  type: 'vacation',
  reason: 'Family trip'
});
```

## 🔐 Authentication

The axios instance automatically:
- Adds JWT token to all requests (from localStorage)
- Redirects to login on 401 errors
- Handles common error responses

## ⚠️ Troubleshooting

### Backend not responding
- Make sure backend is running on port 3001
- Check if MongoDB is connected
- Verify CORS is enabled in backend

### 404 Errors
- Check the endpoint URL in `services/api.ts`
- Verify the route exists in backend

### CORS Errors
- Backend already has CORS enabled
- If issues persist, check backend console logs

## 📖 Next Steps

1. ✅ Test the connection using the dashboard component
2. Start the backend server
3. Implement authentication pages
4. Create forms for CRUD operations
5. Add loading states and error handling
6. Build out individual pages (Payroll, Leaves, etc.)

## 💡 Tips

- Use the `EmployeeList` component as a template for other pages
- All API calls return Promises - use async/await or .then()
- Check browser console and backend logs for debugging
- Token is stored in localStorage and auto-added to requests

## 🎯 Current Status

✅ Axios installed  
✅ API configuration created  
✅ All endpoint functions defined  
✅ Environment variables set  
✅ Example components created  
✅ Connection test component added  
✅ Documentation complete  

**You're ready to start building! 🚀**
