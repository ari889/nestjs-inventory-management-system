import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MenusService } from './menus.service';
import { SortDirection } from 'src/@types/default.types';
import { MenuSchema } from './schemas/menu.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { BlukDeleteMenuDto } from './dto/bulk-delete-menu.dto';

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
    example: 'Menu 1',
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
                  menuName: { type: 'string', example: 'Menu 1' },
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
  async getMenus(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query('deletable') deletable?: string,
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
    @Query('search') search?: string,
  ) {
    const data = await this.menusService.getMenus({
      page,
      limit,
      order,
      direction,
      search,
      deletable: deletable === undefined ? undefined : deletable === 'true',
    });
    return {
      success: true,
      message: 'Menus fetched successfully!',
      data,
    };
  }

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
            id: { type: 'number', example: 1 },
            menuName: { type: 'string', example: 'Menu 1' },
            deletable: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.menusService.findMenu(id);
    return {
      success: true,
      message: 'Menu fetched successfully!',
      data: menu,
    };
  }

  @UsePipes(new ZodValidationPipe(MenuSchema))
  @ApiOkResponse({
    description: 'Menus created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus created successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            menuName: { type: 'string', example: 'Menu 1' },
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
  async createMenu(@Body() createMenuDto: CreateMenuDto) {
    const menu = await this.menusService.createMenu(createMenuDto);
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
    description: 'Menus updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus updated successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            menuName: { type: 'string', example: 'Menu 1' },
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
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(MenuSchema)) updateMenuDto: UpdateMenuDto,
  ) {
    const menu = await this.menusService.updateMenu(id, updateMenuDto);
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
    description: 'Menus deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Menus deleted successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            menuName: { type: 'string', example: 'Menu 1' },
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
  async deleteMenu(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.menusService.deleteMenu(id);
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
    description: 'Menus deleted successfully!',
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
              id: { type: 'number', example: 1 },
              menuName: { type: 'string', example: 'Menu 1' },
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
  })
  @Delete('bulk')
  async bulkDeleteMenu(@Body() body: BlukDeleteMenuDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const menus = await this.menusService.bulkDeleteMenu(body?.ids);
    return {
      success: true,
      message: 'Menus deleted successfully!.',
      data: menus,
    };
  }
}
