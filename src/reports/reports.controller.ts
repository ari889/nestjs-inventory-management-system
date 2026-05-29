import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { Permission } from 'src/common/decorators/permission.decorator';

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
            id: { type: 'number', example: 1 },
            customerGroupId: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Customer 1' },
            companyName: { type: 'string', example: 'Company 1' },
            vatNumber: { type: 'string', example: '1234567890' },
            email: { type: 'string', example: 'supplier1@example.com' },
            phone: { type: 'string', example: '1234567890' },
            address: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'New York' },
            state: { type: 'string', example: 'NY' },
            postalCode: { type: 'string', example: '10001' },
            country: { type: 'string', example: 'USA' },
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
  @Permission('summary-report-view')
  @Get('summary-report')
  async find(@Query('from') from?: string, @Query('to') to?: string) {
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
}
