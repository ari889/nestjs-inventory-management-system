import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SortDirection } from 'src/@types/default.types';
import { BlukDeleteUserDto } from './dto/bulk-delete-user.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { createUserSchema, updateUserSchema } from './schema/user.schema';
import type { FastifyRequest } from 'fastify';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Permission } from 'src/common/decorators/permission.decorator';

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
  @ApiOkResponse({
    description: 'User fetched generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john.doe@example.com' },
              phoneNo: { type: 'string', example: '+1234567890' },
              avatar: {
                type: 'string',
                example: 'https://example.com/avatar.jpg',
              },
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
            },
          },
        },
      },
    },
  })
  @Permission('user-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
  ) {
    const users = await this.usersService.findAll({
      page,
      limit,
      order,
      direction,
    });
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
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phoneNo: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
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
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
            role: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                roleName: { type: 'string', example: 'Admin' },
              },
            },
          },
        },
      },
    },
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
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phoneNo: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            status: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Permission('user-create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) userDto: CreateUserDto,
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
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phoneNo: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            status: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Permission('user-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateUserSchema)) userDto: UpdateUserDto,
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
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phoneNo: { type: 'string', example: '+1234567890' },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            status: { type: 'boolean', example: true },
          },
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
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('user-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@Body() body: BlukDeleteUserDto) {
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
