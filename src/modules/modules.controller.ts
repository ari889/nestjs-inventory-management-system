import {
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
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateModuleDto } from './dto/create-module.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { createModuleSchema } from './schemas/create-module.schema';
import { ModuleItemDto } from './dto/module-item.dto';
import { Permission } from 'src/common/decorators/permission.decorator';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type ModuleQueryDto,
  ModuleQuerySchema,
} from './schemas/module-query.schema';

const moduleProperties = {
  id: { type: 'number', example: 1 },
  menuId: { type: 'number', example: 1 },
  type: { type: 'boolean', example: true },
  moduleName: { type: 'string', example: 'Menus' },
  dividerTitle: { type: 'string', example: 'Menus' },
  iconClass: { type: 'string', example: 'fa fa-home' },
  url: { type: 'string', example: '/' },
  order: { type: 'number', example: 1 },
  parentId: { type: 'number', example: 1 },
  target: { type: 'string', example: 'SELF' },
  deletable: { type: 'boolean', example: true },
};

const moduleWithPermission = {
  permissions: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Menus' },
        slug: { type: 'string', example: 'menus' },
        deletable: { type: 'boolean', example: true },
      },
    },
  },
};

const moduleChildrenProperties = {
  ...moduleProperties,
  children: {
    type: 'object',
    properties: moduleProperties,
  },
};

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  /**
   * Get Modules
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @param deletable
   * @returns Module
   */
  @ApiQuery({
    name: 'order',
    required: false,
    example: 'createdAt',
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
    example: 'Menu 1',
  })
  @ApiQuery({
    name: 'deletable',
    required: false,
    type: Boolean,
    example: undefined,
  })
  @ApiOkResponse({
    description: 'Module fetched successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Module fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: moduleProperties,
              },
            },
            totalItems: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @Permission('module-access')
  @Get()
  async getAllModules(
    @Query(new ZodValidationPipe(ModuleQuerySchema))
    query: ModuleQueryDto,
  ) {
    const data = await this.modulesService.findAll(query);
    return {
      success: true,
      message: 'Modules fetched successfully!',
      data,
    };
  }

  /**
   * Fetch module by menu id
   * @param menuId
   * @returns Module
   */
  @ApiOkResponse({
    description: 'Module success fetched response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module fetched successfully!' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: moduleChildrenProperties,
          },
        },
      },
    },
  })
  @Permission('module-access')
  @Get('/menu/:menuId')
  async getModules(@Param('menuId', ParseIntPipe) menuId: number) {
    const modules = await this.modulesService.getModules(menuId);
    return {
      success: true,
      message: 'Module fetched successfully!',
      data: modules,
    };
  }

  /**
   * Get module by permissions
   * @returns Module
   */
  @ApiOkResponse({
    description: 'Module success fetched response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module fetched successfully!' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ...moduleProperties,
              ...moduleWithPermission,
            },
          },
        },
      },
    },
  })
  @Permission('module-access')
  @Get('permissions')
  async getModulePermissions() {
    const modules = await this.modulesService.getModulePermissions();
    return {
      success: true,
      message: 'Module fetched successfully!',
      data: modules,
    };
  }

  /**
   * Fetched module by role
   * @param req
   * @returns Modules
   */
  @ApiOkResponse({
    description: 'Module fetched by logged in user role!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module fetched successfully!' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: moduleChildrenProperties,
          },
        },
      },
    },
  })
  @Get('/role')
  async getModuleByRole(@Req() req: FastifyRequest) {
    const user = req.user;
    const modules = await this.modulesService.getModuleByRole(user.email);
    return {
      success: true,
      message: 'Get modules by role successfully!',
      data: modules,
    };
  }

  /**
   * Create module
   * @param menuId
   * @param createModuleDto
   * @returns Module
   */
  @ApiOkResponse({
    description: 'Module created successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Module created successfully!' },
        data: {
          type: 'object',
          properties: moduleProperties,
        },
      },
    },
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'order', 'target', 'deletable'],

      properties: {
        type: {
          type: 'boolean',
          example: true,
          description: 'true = Divider, false = Module',
        },

        moduleName: {
          type: 'string',
          example: 'Dashboard',
          nullable: true,
        },

        dividerTitle: {
          type: 'string',
          example: 'Main Menu',
          nullable: true,
        },

        iconClass: {
          type: 'string',
          example: 'List',
          nullable: true,
        },

        url: {
          type: 'string',
          example: '/dashboard',
          nullable: true,
        },

        order: {
          type: 'number',
          example: 1,
        },

        parentId: {
          type: 'number',
          example: 1,
          nullable: true,
        },

        target: {
          type: 'string',
          enum: ['_self', '_blank'],
          example: '_self',
        },

        deletable: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('module-create')
  @Post(':menuId')
  async createModule(
    @Param('menuId', ParseIntPipe) menuId: number,
    @FormBody(new ZodValidationPipe(createModuleSchema))
    createModuleDto: CreateModuleDto,
  ) {
    const module = await this.modulesService.createModule({
      ...createModuleDto,
      menuId,
    });
    return {
      success: true,
      message: 'Module created successfully!',
      data: module,
    };
  }

  /**
   * Delete module by id
   * @param id
   * @returns Module
   */
  @ApiOkResponse({
    description: 'Module deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module deleted successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            moduleName: { type: 'string', example: 'Menus' },
          },
        },
      },
    },
  })
  @Permission('module-delete')
  @Delete(':id')
  async deleteModule(@Param('id', ParseIntPipe) id: number) {
    const module = await this.modulesService.deleteModule(id);
    return {
      success: true,
      message: 'Module deleted successfully!',
      data: module,
    };
  }

  /**
   * Find module by id
   * @param id
   * @returns Module
   */
  @ApiOkResponse({
    description: 'Module fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module fetched successfully!' },
        data: {
          type: 'object',
          properties: moduleProperties,
        },
      },
    },
  })
  @Permission('module-view')
  @Get(':id')
  async findModule(@Param('id', ParseIntPipe) id: number) {
    const module = await this.modulesService.findModule(id);

    if (!module) throw new NotFoundException('Module not found!');

    return {
      success: true,
      message: 'Module fetched successfully!',
      data: module,
    };
  }

  /**
   * Update module by id
   * @param createModuleDto
   * @param id
   * @returns Module
   */
  @ApiOkResponse({
    description: 'Module updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module updated successfully!' },
        data: {
          type: 'object',
          properties: moduleProperties,
        },
      },
    },
  })
  @Permission('module-edit')
  @Patch(':id')
  async updateModule(
    @FormBody(new ZodValidationPipe(createModuleSchema))
    createModuleDto: CreateModuleDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const module = await this.modulesService.updateModule(id, createModuleDto);
    return {
      success: true,
      message: 'Module updated successfully!',
      data: module,
    };
  }

  /**
   * Module update recorder
   * @param items
   * @returns
   */
  @ApiOkResponse({
    description: 'Module update recorder response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module updated successfully!' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: moduleChildrenProperties,
          },
        },
      },
    },
  })
  @Permission('module-arrange')
  @Patch('recorder')
  async reorderMenuItems(@FormBody() items: ModuleItemDto[]) {
    const reorderedItems = await this.modulesService.reorderMenuItems(items);

    return {
      success: true,
      message: 'Module items reordered successfully!',
      data: reorderedItems,
    };
  }
}
