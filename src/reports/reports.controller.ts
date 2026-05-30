import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type DailyQueryDto, DailyQuerySchema } from './schema/daily.schema';
import {
  type MonthlyQueryDto,
  MonthlyQuerySchema,
} from './schema/monthly.schema';
import {
  type SupplierReportQueryDto,
  SupplierReportQuerySchema,
} from './schema/supplier-report.schema';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get summary report
   * @param id
   * @returns Customer
   */
  @ApiOkResponse({
    description: 'Summary report successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Symmary report fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            expense: {
              type: 'object',
              properties: {
                amount: { type: 'number', example: 100.0 },
                totalExpense: { type: 'number', example: 100.0 },
              },
            },
            paymentPaid: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 1 },
                amount: { type: 'number', example: 100.0 },
                cash: { type: 'number', example: 100.0 },
                cheque: { type: 'number', example: 100.0 },
                mobile: { type: 'number', example: 100.0 },
              },
            },
            paymentReceived: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 1 },
                amount: { type: 'number', example: 100.0 },
                cash: { type: 'number', example: 100.0 },
                cheque: { type: 'number', example: 100.0 },
                mobile: { type: 'number', example: 100.0 },
              },
            },
            payroll: {
              type: 'object',
              properties: {
                amount: { type: 'number', example: 100.0 },
                totalPayroll: { type: 'number', example: 100.0 },
              },
            },
            purchase: {
              type: 'object',
              properties: {
                grandTotal: { type: 'number', example: 100.0 },
                paidAmount: { type: 'number', example: 100.0 },
                tax: { type: 'number', example: 100.0 },
                totalPurchase: { type: 'number', example: 100.0 },
              },
            },
            sale: {
              type: 'object',
              properties: {
                grandTotal: { type: 'number', example: 100.0 },
                paidAmount: { type: 'number', example: 100.0 },
                tax: { type: 'number', example: 100.0 },
                totalSale: { type: 'number', example: 100.0 },
              },
            },
            totalItem: { type: 'number', example: 100.0 },
            warehouses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  warehouseId: { type: 'number', example: 1 },
                  warehouseName: { type: 'string', example: 'Warehouse 1' },
                  expense: { type: 'number', example: 100.0 },
                  purchase: {
                    type: 'object',
                    properties: {
                      grandTotal: { type: 'number', example: 100.0 },
                      paidAmount: { type: 'number', example: 100.0 },
                      tax: { type: 'number', example: 100.0 },
                    },
                  },
                  sale: {
                    type: 'object',
                    properties: {
                      grandTotal: { type: 'number', example: 100.0 },
                      paidAmount: { type: 'number', example: 100.0 },
                      tax: { type: 'number', example: 100.0 },
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
  @Permission('summary-report-view')
  @Get('summary-report')
  async summaryReport(@Query('from') from?: string, @Query('to') to?: string) {
    const summaryReport = await this.reportsService.summaryReport(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    return {
      success: true,
      message: 'Symmary report fetched successfully!',
      data: summaryReport,
    };
  }

  /**
   * Get daily sale
   * @param id
   * @returns any
   */
  @ApiOkResponse({
    description: 'Daily sale report successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Daily Sale report fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            '2026-01-01': {
              type: 'object',
              properties: {
                totalDiscount: { type: 'number', example: 100.0 },
                orderDiscount: { type: 'number', example: 100.0 },
                totalTax: { type: 'number', example: 100.0 },
                orderTax: { type: 'number', example: 100.0 },
                shippingCost: { type: 'number', example: 100.0 },
                grandTotal: { type: 'number', example: 100.0 },
              },
            },
          },
        },
      },
    },
  })
  @Permission('daily-sale-access')
  @Get('daily-sale-report')
  async dailySales(
    @Query(new ZodValidationPipe(DailyQuerySchema))
    query: DailyQueryDto,
  ) {
    const report = await this.reportsService.dailySaleReport(
      query.warehouseId,
      query.from,
      query.to,
    );

    return {
      success: true,
      message: 'Daily sale report fetched successfully!',
      data: report,
    };
  }

  /**
   * Monthly sale report
   * @param query
   * @returns
   */
  @ApiOkResponse({
    description: 'Monthly sale report successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Monthly Sale report fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            '2026-01-01': {
              type: 'object',
              properties: {
                totalDiscount: { type: 'number', example: 100.0 },
                orderDiscount: { type: 'number', example: 100.0 },
                totalTax: { type: 'number', example: 100.0 },
                orderTax: { type: 'number', example: 100.0 },
                shippingCost: { type: 'number', example: 100.0 },
                grandTotal: { type: 'number', example: 100.0 },
              },
            },
          },
        },
      },
    },
  })
  @Permission('monthly-sale-access')
  @Get('monthly-sale-report')
  async monthlySales(
    @Query(new ZodValidationPipe(MonthlyQuerySchema))
    query: MonthlyQueryDto,
  ) {
    const year = query.year ?? new Date().getFullYear();

    const data = await this.reportsService.monthlySaleReport(
      query.warehouseId,
      year,
    );

    return {
      success: true,
      message: 'Monthly sale report fetched successfully!',
      data,
    };
  }

  /**
   * Get daily purchase
   * @param id
   * @returns any
   */
  @ApiOkResponse({
    description: 'Daily purchase report successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Daily purchase report fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            '2026-01-01': {
              type: 'object',
              properties: {
                totalDiscount: { type: 'number', example: 100.0 },
                orderDiscount: { type: 'number', example: 100.0 },
                totalTax: { type: 'number', example: 100.0 },
                orderTax: { type: 'number', example: 100.0 },
                shippingCost: { type: 'number', example: 100.0 },
                grandTotal: { type: 'number', example: 100.0 },
              },
            },
          },
        },
      },
    },
  })
  @Permission('daily-purchase-access')
  @Get('daily-purchase-report')
  async dailyPurchase(
    @Query(new ZodValidationPipe(DailyQuerySchema))
    query: DailyQueryDto,
  ) {
    const report = await this.reportsService.dailyPurchaseReport(
      query.warehouseId,
      query.from,
      query.to,
    );

    return {
      success: true,
      message: 'Daily purchase report fetched successfully!',
      data: report,
    };
  }

  /**
   * Monthly purchase report
   * @param query
   * @returns
   */
  @ApiOkResponse({
    description: 'Monthly purchase report successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Monthly purchase report fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            '2026-01-01': {
              type: 'object',
              properties: {
                totalDiscount: { type: 'number', example: 100.0 },
                orderDiscount: { type: 'number', example: 100.0 },
                totalTax: { type: 'number', example: 100.0 },
                orderTax: { type: 'number', example: 100.0 },
                shippingCost: { type: 'number', example: 100.0 },
                grandTotal: { type: 'number', example: 100.0 },
              },
            },
          },
        },
      },
    },
  })
  @Permission('monthly-purchase-access')
  @Get('monthly-purchase-report')
  async monthlyPurchase(
    @Query(new ZodValidationPipe(MonthlyQuerySchema))
    query: MonthlyQueryDto,
  ) {
    const year = query.year ?? new Date().getFullYear();

    const data = await this.reportsService.monthlyPurchaseReport(
      query.warehouseId,
      year,
    );

    return {
      success: true,
      message: 'Monthly purchase report fetched successfully!',
      data,
    };
  }

  /**
   * Get supplier report
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param from
   * @param to
   * @param purchaseNo
   * @param supplierId
   * @returns Purchase
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
    name: 'from',
    required: false,
    type: Date,
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: Date,
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'purchaseNo',
    required: false,
    type: String,
    example: 'PUR-2021-01-01-0001',
  })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Supplier report fetchced successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Supplier report fetched successfully!',
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
                  purchaseNo: { type: 'string', example: 'PUR-1710000000000' },
                  supplierId: { type: 'number', example: 1 },
                  warehouseId: { type: 'number', example: 1 },
                  item: { type: 'number', example: 3 },
                  totalQty: { type: 'number', example: 10 },
                  totalDiscount: { type: 'string', example: '10.00' },
                  totalTax: { type: 'string', example: '5.00' },
                  totalCost: { type: 'string', example: '100.00' },
                  orderTaxRate: { type: 'string', example: '5.00' },
                  orderTax: { type: 'string', example: '5.00' },
                  orderDiscount: { type: 'string', example: '10.00' },
                  shippingCost: { type: 'string', example: '20.00' },
                  grandTotal: { type: 'string', example: '115.00' },
                  paidAmount: { type: 'string', example: '50.00' },
                  purchaseStatus: { type: 'string', example: 'RECEIVED' },
                  paymentStatus: { type: 'boolean', example: false },
                  document: {
                    type: 'string',
                    example: '/uploads/purchases/file.jpg',
                    nullable: true,
                  },
                  note: {
                    type: 'string',
                    example: 'Some note',
                    nullable: true,
                  },
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
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('supplier-report-access')
  @Get('supplier-report')
  async getMenus(
    @Query(new ZodValidationPipe(SupplierReportQuerySchema))
    query: SupplierReportQueryDto,
  ) {
    const data = await this.reportsService.supplierReport(query);
    return {
      success: true,
      message: 'Supplier report fetched successfully!',
      data,
    };
  }
}
