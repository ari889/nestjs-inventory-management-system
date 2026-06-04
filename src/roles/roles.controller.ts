import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import { RolesService } from './roles.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { RoleSchema, UpdateRoleSchema } from './schemas/role.schema';
import { RoleDto, UpdateRoleDto } from './dto/role.dto';
import { Permission } from 'src/common/decorators/permission.decorator';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import {
  type RoleQueryDto,
  RoleQuerySchema,
} from './schemas/role-query.schema';

const roleProperties = {
  id: { type: 'number', example: 1 },
  roleName: { type: 'string', example: 'Permission 1' },
  deletable: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
};

const moduleRole = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      module: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          moduleName: { type: 'string', example: 'Module 1' },
        },
      },
    },
  },
};

const permissionRole = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      permission: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          permissionName: { type: 'string', example: 'Permission 1' },
        },
      },
    },
  },
};

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
    example: 'Role 1',
  })
  @ApiQuery({
    name: 'deletable',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({
    description: 'Roles fetched successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Roles fetched successfull!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: roleProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('role-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(RoleQuerySchema)) query: RoleQueryDto,
  ) {
    const roles = await this.rolesService.findAll(query);
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
            ...roleProperties,
            moduleRole,
            permissionRole,
          },
        },
      },
    },
  })
  @Permission('role-view')
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
    description: 'Role created successfull response!',
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
          properties: roleProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['roleName', 'deletable'],
      properties: {
        roleName: { type: 'string', example: 'Role 1' },
        deletable: {
          type: 'boolean',
          enum: [true, false],
          example: false,
          description: 'true = Deletable, false = Not Deletable',
        },
      },
    },
  })
  @Permission('role-create')
  @Post()
  async create(@FormBody(new ZodValidationPipe(RoleSchema)) roleDto: RoleDto) {
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
          properties: roleProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['roleName', 'moduleIds', 'permissionIds'],
      properties: {
        roleName: {
          type: 'string',
          minLength: 1,
          example: 'Admin',
          description: 'Type a menu name first!',
        },
        deletable: {
          type: 'boolean',
          enum: [true, false],
          example: true,
          description: 'true = Deletable, false = Not Deletable',
        },
        moduleIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description: 'List of module IDs assigned to the role',
        },
        permissionIds: {
          type: 'array',
          items: { type: 'number' },
          example: [10, 11, 12],
          description: 'List of permission IDs assigned to the role',
        },
      },
    },
  })
  @Permission('role-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(UpdateRoleSchema)) roleDto: UpdateRoleDto,
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
  @Permission('role-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.remove(id);
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
    description: 'Roles bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Roles deleted successfully!' },
        data: {
          type: 'object',
          properties: { count: { type: 'number', example: 1 } },
        },
      },
    },
  })
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
        },
      },
    },
  })
  @Permission('role-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BlukDeleteIdsDto) {
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
