import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type PermissionCreateDto,
  PermissionCreateSchema,
  type PermissionDto,
  PermissionSchema,
} from './schemas/permission.schema';
import { Permission } from 'src/common/decorators/permission.decorator';
import type { FastifyRequest } from 'fastify';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type PermissionQueryDto,
  PermissionQuerySchema,
} from './schemas/permission-query.schema';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

const permissionProperties = {
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
};

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
   * @param search
   * @param moduleId
   * @param deletable
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
    name: 'search',
    required: false,
    type: String,
    example: 'Permission 1',
  })
  @ApiQuery({
    name: 'moduleId',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'deletable',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({
    description: 'Permission fetched successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Permission fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: permissionProperties,
              },
            },
            totalItems: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @Permission('permission-access')
  @Get()
  async getPermissions(
    @Query(new ZodValidationPipe(PermissionQuerySchema))
    query: PermissionQueryDto,
  ) {
    const permissions = await this.permissionsService.findAll(query);
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
          properties: permissionProperties,
        },
      },
    },
  })
  @Permission('permission-view')
  @Get(':id')
  async findPermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findOne(id);
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
    description: 'Permission created successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Permission created successfully!',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: permissionProperties,
          },
        },
      },
    },
  })
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['moduleId', 'permissions'],
      properties: {
        moduleId: {
          type: 'number',
          example: 1,
        },
        permissions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'slug'],
            properties: {
              name: { type: 'string', example: 'Create User' },
              slug: { type: 'string', example: 'create-user' },
              deletable: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  @Permission('permission-create')
  @Post()
  async createPermission(
    @FormBody(new ZodValidationPipe(PermissionCreateSchema))
    permissionDto: PermissionCreateDto,
  ) {
    const permission = await this.permissionsService.create(permissionDto);
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
    description: 'Permission updated successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Permission updated successfully!',
        },
        data: {
          type: 'object ',
          properties: permissionProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'slug'],
      properties: {
        name: { type: 'string', example: 'Create User' },
        slug: { type: 'string', example: 'create-user' },
        deletable: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('permission-edit')
  @Patch(':id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(PermissionSchema))
    permissionDto: PermissionDto,
  ) {
    const permission = await this.permissionsService.update(id, permissionDto);
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
          properties: permissionProperties,
        },
      },
    },
  })
  @Permission('permission-delete')
  @Delete(':id')
  async removePermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.remove(id);
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
    description: 'Permissions bulk deleted successfull response!',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: permissionProperties,
      },
    },
  })
  @Permission('permission-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BlukDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const permissions = await this.permissionsService.bulkDelete(body.ids);
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
