import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type CreateUserDto,
  createUserSchema,
  type UpdateUserDto,
  updateUserSchema,
} from './schema/user.schema';
import type { FastifyRequest } from 'fastify';
import { Permission } from 'src/common/decorators/permission.decorator';
import { type UserQueryDto, UserQuerySchema } from './schema/user-query.schema';
import { UserListItem } from './@types/user.types';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { AnyFilesInterceptor } from '@blazity/nest-file-fastify';
import { FormBody } from 'src/common/decorators/form-body.decorator';

const userProperties = {
  id: { type: 'number', example: 1 },
  name: { type: 'string', example: 'John Doe' },
  email: { type: 'string', example: 'john.doe@example.com' },
  phoneNo: { type: 'string', example: '+1234567890' },
  avatar: {
    type: 'string',
    example: 'https://example.com/avatar.jpg',
  },
  gender: { type: 'boolean', example: true },
  status: { type: 'boolean', example: true },
  role: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      roleName: { type: 'string', example: 'Admin' },
    },
  },
  creator: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'John Doe' },
    },
  },
  createdAt: {
    type: 'string',
    example: '2024-01-01T00:00:00.000Z',
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get users with pagination, sorting and searching
   * @param page
   * @param limit
   * @param order
   * @param search
   * @param deletable
   * @param direction
   * @returns User[]
   */
  @ApiQuery({
    name: 'order',
    required: false,
    example: 'id',
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'John Doe',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    type: Boolean,
    example: true,
    description: 'Gender: true = Male, false = Female',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
    example: true,
    description: 'Status: true = Active, false = Inactive',
  })
  @ApiOkResponse({
    description: 'User fetched generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Users fetched successfully' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: userProperties,
              },
            },
            totalItems: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @Permission('user-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(UserQuerySchema)) query: UserQueryDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: UserListItem[];
      totalItems: number;
    };
  }> {
    const users = await this.usersService.findAll(query);
    return {
      success: true,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  /**
   * Get user by id
   * @param email
   * @returns User
   */
  @ApiOkResponse({
    description: 'User fetched generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User fetched successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            status: { type: 'boolean', example: true },
            role: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                roleName: { type: 'string', example: 'Admin' },
                deletable: { type: 'boolean', example: true },
              },
            },
            phoneNo: { type: 'string', example: '+1234567890' },
            gender: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    example: 1,
    description: 'User ID',
  })
  @Permission('user-view')
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);

    if (!user) throw new NotFoundException('User not found!');

    return {
      success: true,
      message: 'User fetched successfully',
      data: user,
    };
  }

  /**
   * Create new user
   * @param userDto
   * @param req
   * @returns User
   */
  @ApiOkResponse({
    description: 'User creation generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: userProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password', 'roleId', 'gender', 'status'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        email: {
          type: 'string',
          example: 'john@example.com',
        },
        phoneNo: {
          type: 'string',
          example: '+1234567890',
          nullable: true,
        },
        password: {
          type: 'string',
          example: 'secret123',
          minLength: 6,
        },
        roleId: {
          type: 'number',
          example: 1,
        },
        avatar: {
          type: 'string',
          format: 'binary',
          nullable: true,
        },
        gender: {
          type: 'boolean',
          enum: [true, false],
          example: true,
          description: 'true = Male, false = Female',
        },
        status: {
          type: 'boolean',
          enum: [true, false],
          example: true,
          description: 'true = Active, false = Inactive',
        },
      },
    },
  })
  @Permission('user-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(createUserSchema)) userDto: CreateUserDto,
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req.user?.email;
    if (!creatorEmail) {
      throw new BadRequestException('Invalid user data!');
    }
    const user = await this.usersService.create(userDto, creatorEmail);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  /**
   * User update by id
   * @param id
   * @param userDto
   * @param req
   * @returns User
   */
  @ApiOkResponse({
    description: 'User update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: userProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password', 'roleId', 'gender', 'status'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        email: {
          type: 'string',
          example: 'john@example.com',
        },
        phoneNo: {
          type: 'string',
          example: '+1234567890',
          nullable: true,
        },
        password: {
          type: 'string',
          example: 'secret123',
          minLength: 6,
        },
        roleId: {
          type: 'number',
          example: 1,
        },
        avatar: {
          type: 'string',
          format: 'binary',
          nullable: true,
        },
        gender: {
          type: 'boolean',
          enum: [true, false],
          example: true,
          description: 'true = Male, false = Female',
        },
        status: {
          type: 'boolean',
          enum: [true, false],
          example: true,
          description: 'true = Active, false = Inactive',
        },
      },
    },
  })
  @Permission('user-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(updateUserSchema)) userDto: UpdateUserDto,
    @Req() req: FastifyRequest,
  ) {
    const updatorEmail = req.user?.email;
    if (!updatorEmail) {
      throw new BadRequestException('Invalid user data!');
    }
    const user = await this.usersService.update(id, updatorEmail, userDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  /**
   * Delete user by id
   * @param id
   * @returns User
   */
  @ApiOkResponse({
    description: 'User deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User removed successfully' },
        data: {
          type: 'object',
          properties: userProperties,
        },
      },
    },
  })
  @Permission('user-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(id);
    return {
      success: true,
      message: 'User removed successfully',
      data: user,
    };
  }

  /**
   * Bulk delete users
   * @param body
   * @returns Role
   */
  @ApiOkResponse({
    description: 'Users bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Users deleted successfully!' },
        data: {
          type: 'object',
          properties: { count: { type: 'number', example: 1 } },
        },
      },
    },
  })
  @Permission('user-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const users = await this.usersService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Users deleted successfully!',
      data: users,
    };
  }
}
