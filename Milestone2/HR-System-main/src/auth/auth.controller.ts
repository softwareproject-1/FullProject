import { Body, Controller, HttpStatus, Post, HttpException, Res, Req, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticationGuard } from './guards/authentication.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async signIn(@Body() signInDto: LoginDto, @Res({ passthrough: true }) res) {
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

      res.cookie('token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        user: result.payload,
      };
    } catch (error) {
      if (error instanceof HttpException || error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Login error:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred during login',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
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
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: 'User already exists',
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred during registration',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
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
        roles: req.user.roles || [],
        permissions: req.user.permissions || [],
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  logout(@Res({ passthrough: true }) res) {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  }
}

