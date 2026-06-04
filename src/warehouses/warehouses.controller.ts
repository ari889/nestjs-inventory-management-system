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
import { WarehousesService } from './warehouses.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type WarehouseDto, WarehouseSchema } from './schemas/warehouse.schema';
import type { FastifyRequest } from 'fastify';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type WarehouseQueryDto,
  WarehouseQuerySchema,
} from './schemas/warehouse-query.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

const warehouseProperties = {
  id: { type: 'number', example: 1 },
  name: { type: 'string', example: 'Warehouse 1' },
  phone: { type: 'string', example: '1234567890' },
  email: { type: 'string', example: 'XbM4o@example.com' },
  address: { type: 'string', example: '123 Main St' },
  status: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
  creator: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'John Doe' },
    },
  },
};

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
   * @param status
   * @param createdBy
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
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
    example: 1,
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
                properties: warehouseProperties,
              },
            },
            totalItems: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @Permission('warehouse-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(WarehouseQuerySchema))
    query: WarehouseQueryDto,
  ) {
    const data = await this.warehousesService.findAll(query);
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
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Warehouse fetched successfully!' },
        data: {
          type: 'object',
          properties: warehouseProperties,
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
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Warehouse created successfully!' },
        data: {
          type: 'object',
          properties: warehouseProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Warehouse One' },
        phone: { type: 'string', example: '1234567890' },
        email: { type: 'string', example: '2M7tH@example.com' },
        address: { type: 'string', example: '123 Main St' },
        status: { type: 'boolean', example: true },
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
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: warehouseProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Warehouse One' },
        phone: { type: 'string', example: '1234567890' },
        email: { type: 'string', example: '2M7tH@example.com' },
        address: { type: 'string', example: '123 Main St' },
        status: { type: 'boolean', example: true },
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
          properties: warehouseProperties,
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
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Warehouses deleted successfully!',
        },
        data: { type: 'number', example: 4 },
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
  @Permission('warehouse-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
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
