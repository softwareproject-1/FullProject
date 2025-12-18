import { Body, Controller, HttpStatus, Post, HttpException, Res, Req, Get, UseGuards, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { LoginDto } from './dto/login.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { AuthenticationGuard } from './guards/authentication.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Public()
  @Post('login')
  async signIn(@Body() signInDto: LoginDto, @Res({ passthrough: true }) res, @Req() req) {
    try {
      const identifier = signInDto.workEmail || signInDto.personalEmail || signInDto.nationalId;
      
      if (!identifier) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Either nationalId, workEmail, or personalEmail must be provided',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.authService.signIn(identifier, signInDto.password);

      // Determine if we need cross-site cookies (Vercel -> Render)
      const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
      const requestOrigin = req.headers?.origin || '';
      const isCrossSite = requestOrigin.includes('vercel.app') || isProduction;

      console.log('Login Cookie Setup:', { isProduction, requestOrigin, isCrossSite });

      res.cookie('token', result.access_token, {
        httpOnly: true,
        secure: isCrossSite, // Must be true for SameSite=None
        sameSite: isCrossSite ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        user: result.payload,
      };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
      });
      
      if (error instanceof HttpException) {
        throw error;
      }

      // Check for database/timeout errors
      if (error?.name === 'MongoServerError' || error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.REQUEST_TIMEOUT,
            message: 'Database query timeout. Please try again.',
          },
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'An error occurred during login',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('register')
  async signup(@Body() registerRequestDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerRequestDto);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'User registered successfully',
        data: result,
      };
    } catch (error) {
      if (error.status === 409) {
        // Return the specific error message from the service
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message || 'User already exists',
            field: this.getConflictField(error.message),
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during registration',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('register-candidate')
  @ApiOperation({ summary: 'Register as a candidate' })
  @ApiBody({ type: RegisterCandidateDto })
  async registerCandidate(@Body() registerCandidateDto: RegisterCandidateDto) {
    try {
      const result = await this.authService.registerCandidate(registerCandidateDto);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Candidate registered successfully',
        data: result,
      };
    } catch (error) {
      if (error.status === 409) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message || 'Candidate already exists',
            field: this.getConflictField(error.message),
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during candidate registration',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getConflictField(message: string): string | null {
    if (!message) return null;
    
    if (message.includes('National ID')) return 'nationalId';
    if (message.includes('Employee number')) return 'employeeNumber';
    if (message.includes('Work email')) return 'workEmail';
    if (message.includes('email')) return 'workEmail';
    
    return null;
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  async getMe(@Req() req: any) {
    try {
      const userId = req.user.sub;
      const employeeProfile = await this.authService.findById(userId);
      
      if (!employeeProfile) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'User profile not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Fetch fresh roles from database instead of using JWT token roles
      const freshRoles = await this.authService.getUserRoles(userId);
      
      console.log('GET /auth/me - User ID:', userId);
      console.log('GET /auth/me - JWT roles:', req.user.roles);
      console.log('GET /auth/me - Fresh roles from DB:', freshRoles.roles);
      console.log('GET /auth/me - Fresh permissions from DB:', freshRoles.permissions);

      return {
        id: employeeProfile._id,
        firstName: employeeProfile.firstName,
        middleName: employeeProfile.middleName,
        lastName: employeeProfile.lastName,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        personalEmail: employeeProfile.personalEmail,
        workEmail: employeeProfile.workEmail,
        mobilePhone: employeeProfile.mobilePhone,
        profilePictureUrl: employeeProfile.profilePictureUrl,
        roles: freshRoles.roles || [],
        permissions: freshRoles.permissions || [],
        status: employeeProfile.status,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while fetching profile',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout')
  @UseGuards(AuthenticationGuard)
  logout(@Res({ passthrough: true }) res, @Req() req) {
    // Determine if we need cross-site cookies (Vercel -> Render)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const requestOrigin = req.headers?.origin || '';
    const isCrossSite = requestOrigin.includes('vercel.app') || isProduction;
    
    res.cookie('token', '', {
      httpOnly: true,
      secure: isCrossSite,
      sameSite: isCrossSite ? 'none' : 'lax',
      expires: new Date(0),
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  }

  @Patch('admin/reset-password/:employeeId')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('System Admin')
  async adminResetPassword(
    @Param('employeeId') employeeId: string,
    @Body() resetPasswordDto: AdminResetPasswordDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.authService.adminResetPassword(
        employeeId,
        resetPasswordDto.newPassword,
        resetPasswordDto.forcePasswordChange || false,
      );

      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        data: {
          employeeId: result.employeeId,
          employeeNumber: result.employeeNumber,
          forcePasswordChange: result.forcePasswordChange,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to reset password',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

