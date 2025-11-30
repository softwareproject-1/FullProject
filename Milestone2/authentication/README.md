# Authentication Module

This module handles user authentication using JWT tokens and integrates with the Employee Profile schemas.

## Features

- **Registration**: Create new employee accounts with password hashing
- **Login**: Authenticate using `nationalId` or `workEmail` with password
- **JWT Token Generation**: Secure token-based authentication
- **Password Hashing**: Uses bcrypt for secure password storage

## Usage

### Registration
```typescript
POST /api/auth/register
Body: {
  firstName: string,
  lastName: string,
  nationalId: string,
  password: string,
  employeeNumber: string,
  dateOfHire: Date,
  // ... other optional fields
}
```

### Login
```typescript
POST /api/auth/login
Body: {
  nationalId: string, // OR workEmail: string
  password: string
}
```

## Integration with Employee Schemas

- Uses `EmployeeProfile` schema for user data
- Uses `EmployeeSystemRole` schema for roles and permissions
- Automatically creates default `DEPARTMENT_EMPLOYEE` role on registration
- Links `accessProfileId` in `EmployeeProfile` to `EmployeeSystemRole`

## Guards

- `JwtAuthGuard`: Protects routes requiring authentication
- Use `@Public()` decorator to mark routes as public (login/register)

## Environment Variables

- `JWT_SECRET`: Secret key for JWT signing (default: 'your-secret-key-change-in-production')
- `JWT_EXPIRES_IN`: Token expiration time (default: '24h')

