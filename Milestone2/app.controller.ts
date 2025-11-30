import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      message: 'Employee Organization Performance API is running',
      version: '1.0.0',
      endpoints: {
        employeeProfile: '/api/employee-profile',
        candidates: '/api/employee-profile/candidates',
        qualifications: '/api/employee-profile/:profileId/qualifications',
        systemRoles: '/api/employee-profile/:profileId/system-roles',
        changeRequests: '/api/employee-profile/change-requests',
      },
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

