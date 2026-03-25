import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CreateModuleDto } from './dto/create-module.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { createModuleSchema } from './schemas/create-module.schema';
import { ModuleItemDto } from './dto/module-item.dto';
import { Permission } from 'src/common/decorators/permission.decorator';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

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
            properties: {
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
              createdAt: {
                type: 'string',
                example: '2021-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2021-01-01T00:00:00.000Z',
              },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
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
              permissions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: 'Create User' },
                    slug: { type: 'string', example: 'create-user' },
                    deletable: { type: 'boolean', example: true },
                  },
                },
              },
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
            properties: {
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
              createdAt: {
                type: 'string',
                example: '2021-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2021-01-01T00:00:00.000Z',
              },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
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
    description: 'Module created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Module created successfully!' },
        data: {
          type: 'object',
          properties: {
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
  @Permission('module-create')
  @Post(':menuId')
  async createModule(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body(new ZodValidationPipe(createModuleSchema))
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
          properties: {
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
          properties: {
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
  @Permission('module-edit')
  @Patch(':id')
  async updateModule(
    @Body(new ZodValidationPipe(createModuleSchema))
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
            properties: {
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
              createdAt: {
                type: 'string',
                example: '2021-01-01T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                example: '2021-01-01T00:00:00.000Z',
              },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
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
      },
    },
  })
  @Permission('module-arrange')
  @Patch('recorder')
  async reorderMenuItems(@Body() items: ModuleItemDto[]) {
    const reorderedItems = await this.modulesService.reorderMenuItems(items);

    return {
      success: true,
      message: 'Module items reordered successfully!',
      data: reorderedItems,
    };
  }
}
