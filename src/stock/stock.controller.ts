import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type StockQueryDto, StockQuerySchema } from './schema/stock.schema';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * Get low stock product
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param name
   * @param warehouseId
   * @returns Product
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
    example: 'Product 1',
  })
  @ApiQuery({
    name: 'warehouseId',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Stock fetchced successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Stock report fetched successfully!',
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
                  qty: { type: 'number', example: 10 },
                  warehouse: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      name: { type: 'string', example: 'Warehouse 1' },
                    },
                  },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      name: { type: 'string', example: 'Product 1' },
                      code: { type: 'string', example: 'P-123' },
                      unit: {
                        type: 'object',
                        properties: {
                          unitName: { type: 'string', example: 'Unit 1' },
                        },
                      },
                      category: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', example: 'Category 1' },
                        },
                      },
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
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('stock-access')
  @Get()
  async getProductStock(
    @Query(new ZodValidationPipe(StockQuerySchema))
    query: StockQueryDto,
  ) {
    const data = await this.stockService.findAll(query);
    return {
      success: true,
      message: 'Stock fetched successfully!',
      data,
    };
  }
}
