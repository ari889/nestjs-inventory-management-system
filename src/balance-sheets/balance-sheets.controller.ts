import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permission } from 'src/common/decorators/permission.decorator';
import { BalanceSheetsService } from './balance-sheets.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('balance-sheets')
export class BalanceSheetsController {
  constructor(private readonly balanceSheetsService: BalanceSheetsService) {}

  /**
   * Get balance sheet
   * @returns Accounts
   */
  @ApiOkResponse({
    description: 'Get single attendance successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Attendance fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            employeeId: { type: 'number', example: 1 },
            checkIn: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            checkOut: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
            date: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
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
  @Permission('balance-sheet-view')
  @Get()
  async find(@Query('from') from?: string, @Query('to') to?: string) {
    const parsedFrom = from ? new Date(from) : undefined;
    const parsedTo = to ? new Date(to) : undefined;
    const balanceSheet = await this.balanceSheetsService.findAll(
      parsedFrom,
      parsedTo,
    );
    return {
      success: true,
      message: 'Balance sheet fetched successfully!',
      data: balanceSheet,
    };
  }
}
