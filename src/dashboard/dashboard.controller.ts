import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permission } from 'src/common/decorators/permission.decorator';
import {
  type DashboaradQueryDto,
  DashboardQuerySchema,
} from './schemas/dashboard.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get all dashboard data
   * @returns sectionCards, monthlyOverview, yearlyReport, cashFlow
   */
  @ApiOkResponse({
    description: 'Dashboard data fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Dashboard data fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            sectionCards: {
              type: 'object',
              properties: {
                sale: { type: 'number', example: 55000 },
                purchase: { type: 'number', example: 42000 },
                expense: { type: 'number', example: 8200 },
                profit: { type: 'number', example: 4800 },
                totalCustomers: { type: 'number', example: 120 },
                totalSuppliers: { type: 'number', example: 340 },
                deltas: {
                  type: 'object',
                  properties: {
                    sale: { type: 'number', example: 5.2, nullable: true },
                    purchase: { type: 'number', example: -2.1, nullable: true },
                    expense: { type: 'number', example: 1.3, nullable: true },
                    profit: { type: 'number', example: 8.4, nullable: true },
                  },
                },
              },
            },
            monthlyOverview: {
              type: 'object',
              properties: {
                sale: { type: 'number', example: 55000 },
                purchase: { type: 'number', example: 42000 },
                expense: { type: 'number', example: 8200 },
              },
            },
            yearlyReport: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string', example: 'January' },
                  totalSale: { type: 'number', example: 55000 },
                  totalPurchase: { type: 'number', example: 42000 },
                  totalExpense: { type: 'number', example: 8200 },
                },
              },
            },
            cashFlow: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string', example: 'January' },
                  received: { type: 'number', example: 55000 },
                  sent: { type: 'number', example: 42000 },
                },
              },
            },
          },
        },
      },
    },
  })
  @Permission('dashboard-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(DashboardQuerySchema))
    query: DashboaradQueryDto,
  ) {
    const data = await this.dashboardService.findAll(query);
    return {
      success: true,
      message: 'Dashboard data fetched successfully!',
      data,
    };
  }
}
