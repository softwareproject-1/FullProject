import { Body, Controller, HttpStatus, Post, HttpException, Res, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticationGuard } from './guards/authentication.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Post('login')
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
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

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

