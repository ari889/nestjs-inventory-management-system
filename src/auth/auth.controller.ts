import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema } from './schemas/login.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import {
  LoginDto,
  LoginResponseDto,
  LoginValidateErrorDto,
} from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UsePipes(new ZodValidationPipe(LoginSchema))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login Successful!', type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed!',
    type: LoginValidateErrorDto,
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Refresh token generated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Refresh token generated successfully!',
        },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: {
          type: 'number',
          example: 1661504000,
        },
      },
    },
  })
  async refreshToken(@Request() request: { user: { email: string } }) {
    return this.authService.refreshToken(request.user.email);
  }
}
