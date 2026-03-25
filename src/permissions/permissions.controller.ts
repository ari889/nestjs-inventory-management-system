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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  PermissionItemSchema,
  PermissionSchema,
} from './schemas/create-permission.schema';
import { PermissionItemDto } from './dto/permission-item.dto';
import { CreatePermissionDto } from './dto/permission.dto';
import { BlukDeletePermissionDto } from './dto/bulk-delete-permission.dto';
import { Permission } from 'src/common/decorators/permission.decorator';
import type { FastifyRequest } from 'fastify';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Get all permission
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Permission
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
    name: 'name',
    required: false,
    type: String,
    example: 'Permission 1',
  })
  @ApiQuery({
    name: 'slug',
    required: false,
    type: String,
    example: 'permission-1',
  })
  @ApiQuery({
    name: 'deletable',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({
    description: 'Menus fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  module: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      moduleName: { type: 'string', example: 'Module 1' },
                    },
                  },
                  name: { type: 'string', example: 'Permission 1' },
                  slug: { type: 'string', example: 'permission-1' },
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
  @Permission('permission-access')
  @Get()
  async getPermissions(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query('name') name?: string,
    @Query('slug') slug?: string,
    @Query('deletable') deletable?: string,
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
  ) {
    const permissions = await this.permissionsService.getPermissions({
      page,
      limit,
      order,
      direction,
      name,
      slug,
      deletable: deletable === undefined ? undefined : deletable === 'true',
    });
    return {
      success: true,
      message: 'Permissions fetched successfully!',
      data: permissions,
    };
  }

  /**
   * Get permission by id
   * @param id
   * @returns Permission
   */
  @ApiOkResponse({
    description: 'Permission fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Permission fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            module: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                moduleName: { type: 'string', example: 'Module 1' },
              },
            },
            name: { type: 'string', example: 'Permission 1' },
            slug: { type: 'string', example: 'permission-1' },
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
  @Permission('permission-view')
  @Get(':id')
  async findPermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findPermission(id);
    if (!permission) throw new NotFoundException('Permission not found.');
    return {
      success: true,
      message: 'Permission fetched successfully!',
      data: permission,
    };
  }

  /**
   * Create Permission
   * @param permissionDto
   * @returns Permission
   */
  @ApiOkResponse({
    description: 'Permission created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Permission created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            module: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                moduleName: { type: 'string', example: 'Module 1' },
              },
            },
            name: { type: 'string', example: 'Permission 1' },
            slug: { type: 'string', example: 'permission-1' },
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
  @Permission('permission-create')
  @Post()
  async createPermission(
    @Body(new ZodValidationPipe(PermissionSchema))
    permissionDto: CreatePermissionDto,
  ) {
    const permission =
      await this.permissionsService.createPermission(permissionDto);
    return {
      success: true,
      message: 'Permission created successfully!',
      data: permission,
    };
  }

  /**
   * Update permission by id
   * @param id
   * @param permissionDto
   * @returns Permission
   */
  @ApiOkResponse({
    description: 'Permission updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Permission updated successfully!',
        },
        data: {
          type: 'object ',
          properties: {
            id: { type: 'number', example: 1 },
            module: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                moduleName: { type: 'string', example: 'Module 1' },
              },
            },
            name: { type: 'string', example: 'Permission 1' },
            slug: { type: 'string', example: 'permission-1' },
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
  @Permission('permission-edit')
  @Patch(':id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(PermissionItemSchema))
    permissionDto: PermissionItemDto,
  ) {
    const permission = await this.permissionsService.updatePermission(
      id,
      permissionDto,
    );
    return {
      success: true,
      message: 'Permission updated successfully!',
      data: permission,
    };
  }

  /**
   * Delete Permission by id
   * @param id
   * @returns Permission
   */
  @ApiOkResponse({
    description: 'Permission fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Permission fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            module: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                moduleName: { type: 'string', example: 'Module 1' },
              },
            },
            name: { type: 'string', example: 'Permission 1' },
            slug: { type: 'string', example: 'permission-1' },
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
  @Permission('permission-delete')
  @Delete(':id')
  async removePermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findPermission(id);
    if (!permission) throw new NotFoundException('Permission not found.');
    if (permission?.deletable === false)
      throw new ForbiddenException(
        'You have no enough permissions to do this.',
      );
    await this.permissionsService.deletePermission(id);
    return {
      success: true,
      message: 'Permission deleted successfully!',
      data: permission,
    };
  }

  /**
   * Bulk Delete Permissions
   * @param body
   * @returns Permissions
   */
  @ApiOkResponse({
    description: 'Permissions deleted successfully!',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          module: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              moduleName: { type: 'string', example: 'Module 1' },
            },
          },
          name: { type: 'string', example: 'Permission 1' },
          slug: { type: 'string', example: 'permission-1' },
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
  })
  @Permission('permission-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@Body() body: BlukDeletePermissionDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const permissions = await this.permissionsService.bulkDeletePermission(
      body.ids,
    );
    return {
      success: true,
      message: 'Permissions deleted successfully!',
      data: permissions,
    };
  }

  /**
   * Check user permission by slug
   * @param slug
   * @param req
   * @returns Boolean
   */
  @ApiOkResponse({
    description: 'Slug check successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'You are allowed to do this!' },
      },
    },
  })
  @Get('check-slug/:slug')
  async checkSlug(@Param('slug') slug: string, @Req() req: FastifyRequest) {
    const { email } = req.user;
    const checkPermission = await this.permissionsService.checkSlug(
      slug,
      email,
    );

    if (!checkPermission)
      throw new ForbiddenException(
        'You have no enough permissions to do this.',
      );
    return {
      success: true,
      message: 'You are allowed to do this!',
    };
  }
}
