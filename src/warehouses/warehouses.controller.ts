import {
  BadRequestException,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WarehousesService } from './warehouses.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { BlukDeleteWarehouseDto, WarehouseDto } from './dto/warehouse.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { WarehouseSchema } from './schemas/warehouse.schema';
import type { FastifyRequest } from 'fastify';
import { FormBody } from 'src/common/decorators/form-body.decorator';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  /**
   * Find All Warehouses
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @returns Warehouses
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
    example: 'Warehouse 1',
  })
  @ApiOkResponse({
    description: 'Warehouses fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Warehouses fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Warehouse 1' },
                  phone: { type: 'string', example: '1234567890' },
                  address: { type: 'string', example: '123 Main St' },
                  status: { type: 'boolean', example: true },
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
  @Permission('warehouse-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
    @Query('search') search?: string,
  ) {
    const data = await this.warehousesService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Warehouses fetched successfully!',
      data,
    };
  }

  /**
   * Warehouse Details by Id
   * @param id
   * @returns Warehouse
   */
  @ApiOkResponse({
    description: 'Warehouse fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Warehouse fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Warehouse 1' },
            email: { type: 'string', example: '2mX3o@example.com' },
            phone: { type: 'string', example: '1234567890' },
            address: { type: 'string', example: '123 Main St' },
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
  @Permission('warehouse-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const warehouse = await this.warehousesService.findOne(id);
    return {
      success: true,
      message: 'Warehouse fetched successfully!',
      data: warehouse,
    };
  }

  /**
   * Create a Warehouse
   * @param createWarehouseDto
   * @param req
   * @returns Warehouse
   */
  @ApiOkResponse({
    description: 'Warehouse created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Warehouse created successfully!' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Warehouse 1' },
            email: { type: 'string', example: '2mX3o@example.com' },
            phone: { type: 'string', example: '1234567890' },
            address: { type: 'string', example: '123 Main St' },
            status: { type: 'boolean', example: true },
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
  @Permission('warehouse-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(WarehouseSchema))
    warehouseDto: WarehouseDto,
    @Req() req: FastifyRequest,
  ) {
    const warehouse = await this.warehousesService.create(
      warehouseDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Warehouse created successfully!',
      data: warehouse,
    };
  }

  /**
   * Warehouse update by id
   * @param id
   * @param warehouseDto
   * @param req
   * @returns Warehouse
   */
  @ApiOkResponse({
    description: 'Warehouse update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Warehouse 1' },
            email: { type: 'string', example: '2mX3o@example.com' },
            phone: { type: 'string', example: '1234567890' },
            address: { type: 'string', example: '123 Main St' },
            status: { type: 'boolean', example: true },
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
            updatedAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Permission('warehouse-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(WarehouseSchema))
    warehouseDto: WarehouseDto,
    @Req() req: FastifyRequest,
  ) {
    const updatorEmail = req.user?.email;
    if (!updatorEmail) {
      throw new BadRequestException('Invalid user data!');
    }
    const warehouse = await this.warehousesService.update(
      id,
      updatorEmail,
      warehouseDto,
    );
    return {
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    };
  }

  /**
   * Delete Warehouse by Id
   * @param id
   * @returns Warehouse
   */
  @ApiOkResponse({
    description: 'Warehouse deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Warehouses deleted successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Warehouse 1' },
            phone: { type: 'string', example: '1234567890' },
            address: { type: 'string', example: '123 Main St' },
            status: { type: 'boolean', example: true },
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
  @Permission('warehouse-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const warehouse = await this.warehousesService.findOne(id);
    await this.warehousesService.remove(id);
    return {
      success: true,
      message: 'Warehouse deleted successfully!.',
      data: warehouse,
    };
  }

  /**
   * Bulk delete warehouses
   * @param body
   * @returns Warehouses
   */
  @ApiOkResponse({
    description: 'Warehouses bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Users deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('warehouse-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BlukDeleteWarehouseDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const warehouses = await this.warehousesService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Warehouses deleted successfully!',
      data: warehouses,
    };
  }
}
