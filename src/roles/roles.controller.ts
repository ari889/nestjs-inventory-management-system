import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesService } from './roles.service';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { RoleSchema } from './schemas/role.schema';
import { RoleDto } from './dto/role.dto';
import { BlukDeleteRoleDto } from './schemas/role-bulk-delete.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Get all roles
   * @param page
   * @param limit
   * @param order
   * @param name
   * @param deletable
   * @param direction
   * @returns Role
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
    example: 1,
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
    example: 'Role 1',
  })
  @ApiQuery({
    name: 'deletable',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({
    description: 'Roles fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Roles fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  roleName: { type: 'string', example: 'Permission 1' },
                  deletable: { type: 'boolean', example: true },
                  createdAt: {
                    type: 'string',
                    example: '2021-01-01T00:00:00.000Z',
                  },
                  updatedAt: {
                    type: 'string',
                    example: '2021-01-01T00:00:00.000Z',
                  },
                },
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query('search') search?: string,
    @Query('deletable') deletable?: string,
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
  ) {
    const roles = await this.rolesService.findAll({
      page,
      limit,
      order,
      direction,
      search,
      deletable: deletable === undefined ? undefined : deletable === 'true',
    });
    return {
      success: true,
      message: 'Roles fetched successfully!',
      data: roles,
    };
  }

  /**
   * Find role by id
   * @param id
   * @returns Role
   */
  @ApiOkResponse({
    description: 'Role fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Role fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            roleName: { type: 'string', example: 'Role 1' },
            deletable: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOne(id);
    return {
      success: true,
      message: 'Role fetched successfully!',
      data: role,
    };
  }

  /**
   * Create new role
   * @param roleDto
   * @returns Role
   */
  @ApiOkResponse({
    description: 'Role created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Role created successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            roleName: { type: 'string', example: 'Role 1' },
            deletable: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Post()
  async create(@Body(new ZodValidationPipe(RoleSchema)) roleDto: RoleDto) {
    const role = await this.rolesService.create(roleDto);
    return {
      success: true,
      message: 'Role created successfully!',
      data: role,
    };
  }

  /**
   * Update role by id
   * @param id
   * @param updateRoleDto
   * @returns Role
   */
  @ApiOkResponse({
    description: 'Role updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Role updated successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            roleName: { type: 'string', example: 'Role 1' },
            deletable: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(RoleSchema)) roleDto: RoleDto,
  ) {
    const role = await this.rolesService.update(id, roleDto);
    return {
      success: true,
      message: 'Role updated successfully!',
      data: role,
    };
  }

  /**
   * Delete role by id
   * @param id
   * @returns Role
   */
  @ApiOkResponse({
    description: 'Role deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Role deleted successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            roleName: { type: 'string', example: 'Role 1' },
            deletable: { type: 'boolean', example: true },
            createdAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOne(id);
    if (!role) throw new NotFoundException('Role not found!');
    if (role?.deletable === false)
      throw new ForbiddenException(
        'You have no enough permissions to do this!',
      );
    await this.rolesService.remove(id);
    return {
      success: true,
      message: 'Role deleted successfully!',
      data: role,
    };
  }

  /**
   * Bulk delete roles
   * @param body
   * @returns Role
   */
  @ApiOkResponse({
    description: 'Roles fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Roles fetched successfully!' },
        data: {
          type: 'object',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                roleName: { type: 'string', example: 'Permission 1' },
                deletable: { type: 'boolean', example: true },
                createdAt: {
                  type: 'string',
                  example: '2021-01-01T00:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  example: '2021-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  })
  @Delete('bulk')
  async bulkDelete(@Body() body: BlukDeleteRoleDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const roles = await this.rolesService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Roles deleted successfully!',
      data: roles,
    };
  }
}
