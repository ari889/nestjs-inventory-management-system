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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MenusService } from './menus.service';
import { MenuSchema } from './schemas/menu.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Permission } from 'src/common/decorators/permission.decorator';
import {
  type MenuQueryDto,
  MenuQuerySchema,
} from './schemas/menu-query.schema';
import { AnyFilesInterceptor } from '@blazity/nest-file-fastify';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

const menuProperties = {
  id: { type: 'number', example: 1 },
  menuName: { type: 'string', example: 'Menu 1' },
  deletable: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  /**
   * Get Menus
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @returns Menus
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
    description: 'Menus fetched successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Menus fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: menuProperties,
              },
            },
            totalItems: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @Permission('menu-access')
  @Get()
  async getMenus(
    @Query(new ZodValidationPipe(MenuQuerySchema))
    query: MenuQueryDto,
  ) {
    const data = await this.menusService.findAll(query);
    return {
      success: true,
      message: 'Menus fetched successfully!',
      data,
    };
  }

  /**
   * Find menu by it's id
   * @param id
   * @returns Menu
   */
  @ApiOkResponse({
    description: 'Menus fetched successfull reponse!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Menus fetched successfully!' },
        data: {
          type: 'object',
          properties: menuProperties,
        },
      },
    },
  })
  @Permission('menu-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.menusService.find(id);
    return {
      success: true,
      message: 'Menu fetched successfully!',
      data: menu,
    };
  }

  /**
   * Create new menu
   * @param createMenuDto
   * @returns Menu
   */
  @ApiOkResponse({
    description: 'Menus created successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Menus created successfully!' },
        data: {
          type: 'object',
          properties: menuProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['menuName', 'deletable'],
      properties: {
        menuName: {
          type: 'string',
          example: 'Menu 1',
        },
        deletable: {
          type: 'boolean',
          enum: [true, false],
          example: false,
          description: 'true = Deletable, false = Not Deletable',
        },
      },
    },
  })
  @Permission('menu-create')
  @Post()
  async createMenu(
    @FormBody(new ZodValidationPipe(MenuSchema)) createMenuDto: CreateMenuDto,
  ) {
    const menu = await this.menusService.create(createMenuDto);
    return {
      success: true,
      message: 'Menu created successfully!',
      data: menu,
    };
  }

  /**
   * Update menu by it's id
   * @param id
   * @param updateMenuDto
   * @returns Menu
   */
  @ApiOkResponse({
    description: 'Menus updated successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus updated successfully!' },
        data: {
          type: 'object',
          properties: menuProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    schema: {
      type: 'object',
      required: ['menuName', 'deletable'],
      properties: {
        menuName: {
          type: 'string',
          example: 'Menu 1',
        },
        deletable: {
          type: 'boolean',
          enum: [true, false],
          example: true,
          description: 'true = Deletable, false = Not Deletable',
        },
      },
    },
  })
  @Permission('menu-edit')
  @Patch(':id')
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(MenuSchema)) updateMenuDto: UpdateMenuDto,
  ) {
    const menu = await this.menusService.update(id, updateMenuDto);
    return {
      success: true,
      message: 'Menu updated successfully!',
      data: menu,
    };
  }

  /**
   * Delete menu by it's id
   * @param id
   * @returns Menu
   */
  @ApiOkResponse({
    description: 'Menus deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Menus deleted successfully!' },
        data: {
          type: 'object',
          properties: menuProperties,
        },
      },
    },
  })
  @Permission('menu-delete')
  @Delete(':id')
  async deleteMenu(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.menusService.remove(id);
    return {
      success: true,
      message: 'Menu deleted successfully!.',
      data: menu,
    };
  }

  /**
   * Bulk delete menus
   * @param body
   * @returns Menus
   */
  @ApiOkResponse({
    description: 'Menus deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus deleted successfully!' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Permission('menu-bulk-delete')
  @Delete('bulk')
  async bulkDeleteMenu(@FormBody() body: BlukDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const menus = await this.menusService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Menus deleted successfully!.',
      data: menus,
    };
  }
}
