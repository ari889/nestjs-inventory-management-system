import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema } from './schemas/login.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ProfileDto, ProfileSchema } from './schemas/profile.schema';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import {
  type ChangePasswordDto,
  ChangePasswordSchema,
} from './schemas/password.schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Validate user login
   * @param loginDto
   * @returns {Promise<any>}
   */
  @UsePipes(new ZodValidationPipe(LoginSchema))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login Successful Response!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'You are successfully logged in!',
        },
        data: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            expiresIn: {
              type: 'number',
              example: 1661504000,
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        message: {
          type: 'string',
          example: 'Validation failed!',
        },
        errors: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              example: 'Enter a valid email address!',
            },
            password: {
              type: 'string',
              example: 'Password is required!',
            },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * Refresh token rotation
   * @param request
   * @returns {Promise<{success: boolean; message: string; data: {accessToken: string; expiresIn: number}}>}
   */
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Refresh generation response!',
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
        data: {
          type: 'object',
          properties: {
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
      },
    },
  })
  async refreshToken(@Request() request: { user: { email: string } }) {
    return this.authService.refreshToken(request.user.email);
  }

  /**
   * Get user details
   * @param request
   * @returns {Promise<User>}
   */
  @UseGuards(JwtAuthGuard)
  @Get('user')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User details successful response!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'User details fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phoneNo: { type: 'string', example: '+1234567890' },
            emailVerifiedAt: {
              type: 'string',
              example: '2022-01-01T00:00:00.000Z',
            },
            role: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Admin' },
              },
            },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            gender: { type: 'boolean', example: true },
            status: { type: 'boolean', example: true },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John Doe' },
              },
            },
            updator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John Doe' },
              },
            },
            createdAt: {
              type: 'string',
              example: '2022-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2022-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  async user(@Request() request: { user: { email: string } }) {
    const user = await this.authService.getUser(request?.user.email);
    return {
      success: true,
      message: 'User details fetched successfully!',
      data: user,
    };
  }

  /**
   * Update user profile
   * @param request
   * @returns {Promise<User>}
   */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User profile update successful response!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Your profile updated successfully!',
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            phoneNo: { type: 'string', example: '+1234567890' },
            gender: { type: 'boolean', example: true },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
          },
        },
      },
    },
  })
  async updateProfile(
    @Body() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      avatar?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const validated = new ZodValidationPipe(ProfileSchema).transform({
      ...body,
      avatar: files.avatar?.[0],
    }) as ProfileDto;
    const user = await this.authService.updateProfile(
      validated,
      req?.user?.email,
      validated.avatar,
    );
    return {
      success: true,
      message: 'Your profile updated successfully!',
      data: user,
    };
  }

  /**
   * Update user password
   * @param request
   * @returns {Promise<User>}
   */
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User password update successful response!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Your password updated successfully!',
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            phoneNo: { type: 'string', example: '+1234567890' },
            gender: { type: 'boolean', example: true },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
          },
        },
      },
    },
  })
  async updatePassword(
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordDto,
    @Req() req: FastifyRequest,
  ) {
    const user = await this.authService.updatePassword(
      req?.user?.email,
      body.newPassword,
      body.oldPassword,
    );
    return {
      success: true,
      message: 'Your password updated successfully!',
      data: user,
    };
  }
}
