/**
 * Swagger Configuration
 * This file contains Swagger/OpenAPI configuration constants
 */

export const SWAGGER_CONFIG = {
  title: 'HR System API',
  description: 'Comprehensive API documentation for HR System',
  version: '1.0.0',
  path: 'api',
  tags: [
    { name: 'time-management', description: 'Time Management endpoints' },
    { name: 'recruitment', description: 'Recruitment endpoints' },
    { name: 'leaves', description: 'Leave management endpoints' },
    { name: 'employee-profile', description: 'Employee profile management endpoints' },
    { name: 'organization-structure', description: 'Organization structure endpoints' },
    { name: 'payroll-configuration', description: 'Payroll configuration endpoints' },
    { name: 'payroll-execution', description: 'Payroll execution endpoints' },
    { name: 'payroll-tracking', description: 'Payroll tracking endpoints' },
    { name: 'performance', description: 'Performance management endpoints' },
  ],
  servers: [
    { url: 'http://localhost:3000', description: 'Development server' },
    { url: 'http://localhost:3001', description: 'Production server' },
  ],
};

