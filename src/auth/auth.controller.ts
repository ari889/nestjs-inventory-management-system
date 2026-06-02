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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { type LoginDto, LoginSchema } from './schemas/login.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { FormBody } from 'src/common/decorators/form-body.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Validate user login
   * @param loginDto
   * @returns {Promise<any>}
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          example: 'admin@gmail.com',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'asdfg1234',
        },
      },
    },
  })
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
  async login(
    @FormBody(new ZodValidationPipe(LoginSchema)) loginDto: LoginDto,
  ) {
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
            avatar: {
              type: 'string',
              example:
                '/uploads/users/3c3a7f08-80ff-419d-b70d-f23393a0beb1.png',
            },
            phoneNo: { type: 'string', example: '+1234567890' },
            role: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Admin' },
              },
            },
            status: { type: 'boolean', example: true },
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
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'phoneNo', 'gender'],
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        phoneNo: {
          type: 'string',
          example: '+1234567890',
        },
        gender: {
          type: 'string',
          enum: ['true', 'false'],
          example: 'true',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Profile update successful response!',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Profile updated successfully!',
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            avatar: {
              type: 'string',
              example:
                '/uploads/users/3c3a7f08-80ff-419d-b70d-f23393a0beb1.png',
            },
            phoneNo: { type: 'string', example: '+1234567890' },
            gender: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
  async updateProfile(
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles() files: { avatar?: MemoryStorageFile[] },
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['oldPassword', 'newPassword', 'reEnterPassword'],
      properties: {
        oldPassword: {
          type: 'string',
          format: 'password',
          example: 'asdfg1234',
        },
        newPassword: {
          type: 'string',
          format: 'password',
          example: 'asdfg12345',
        },
        reEnterPassword: {
          type: 'string',
          format: 'password',
          example: 'asdfg12345',
        },
      },
    },
  })
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
          },
        },
      },
    },
  })
  async updatePassword(
    @FormBody(new ZodValidationPipe(ChangePasswordSchema))
    body: ChangePasswordDto,
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
