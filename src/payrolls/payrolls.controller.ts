import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
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
import { PayrollsService } from './payrolls.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type PayrollDto, PayrollSchema } from './schemas/payroll.schema';
import type { FastifyRequest } from 'fastify';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  /**
   * Get all Payroll
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Payroll
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
    example: 'search',
  })
  @ApiOkResponse({
    description: 'Payroll fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payroll fetched successfully!',
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
                  employeeId: { type: 'number', example: 1 },
                  accountId: { type: 'number', example: 1 },
                  amount: { type: 'number', example: 100 },
                  paymentMethods: { type: 'string', example: 'CASH' },
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
  @Permission('payroll-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
  ) {
    const payroll = await this.payrollsService.findAll({
      page,
      limit,
      order,
      direction,
    });
    return {
      success: true,
      message: 'Payroll fetched successfully!',
      data: payroll,
    };
  }

  /**
   * Get payroll by id
   * @param id
   * @returns Payroll
   */
  @ApiOkResponse({
    description: 'Get single payroll successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payroll fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            employeeId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            paymentMethods: { type: 'string', example: 'CASH' },
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
  @Permission('payroll-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const payroll = await this.payrollsService.findOne(id);
    if (!payroll) throw new NotFoundException('Payroll not found.');
    return {
      success: true,
      message: 'Payroll fetched successfully!',
      data: payroll,
    };
  }

  /**
   * Create payroll
   * @param payrollDto
   * @returns Payroll
   */

  @ApiOkResponse({
    description: 'Payroll created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payroll created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            employeeId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            paymentMethods: { type: 'string', example: 'CASH' },
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'employeeId',
        'accountId',
        'amount',
        'paymentMethods',
        'status',
      ],
      properties: {
        employeeId: {
          type: 'number',
          example: 1,
        },
        accountId: {
          type: 'number',
          example: 1,
        },
        amount: {
          type: 'number',
          example: 100,
        },
        paymentMethods: {
          type: 'string',
          example: 'CASH',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('payroll-create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(PayrollSchema))
    payrollDto: PayrollDto,
    @Req() req: FastifyRequest,
  ) {
    const payroll = await this.payrollsService.create(
      payrollDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Payroll created successfully!',
      data: payroll,
    };
  }

  /**
   * Update payroll by id
   * @param id
   * @param payrollDto
   * @returns Payroll
   */
  @ApiOkResponse({
    description: 'Payroll updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payroll updated successfully!',
        },
        data: {
          type: 'object ',
          properties: {
            id: { type: 'number', example: 1 },
            employeeId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            paymentMethods: { type: 'string', example: 'CASH' },
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'employeeId',
        'accountId',
        'amount',
        'paymentMethods',
        'status',
      ],
      properties: {
        employeeId: {
          type: 'number',
          example: 1,
        },
        accountId: {
          type: 'number',
          example: 1,
        },
        amount: {
          type: 'number',
          example: 100,
        },
        paymentMethods: {
          type: 'string',
          example: 'CASH',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('payroll-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(PayrollSchema))
    payrollDto: PayrollDto,
    @Req() req: FastifyRequest,
  ) {
    const payroll = await this.payrollsService.update(
      id,
      payrollDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Payroll updated successfully!',
      data: payroll,
    };
  }

  /**
   * Delete payroll by id
   * @param id
   * @returns Payroll
   */
  @ApiOkResponse({
    description: 'Payroll deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payroll fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            employeeId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            paymentMethods: { type: 'string', example: 'CASH' },
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
  @Permission('payroll-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const payroll = await this.payrollsService.remove(id);
    return {
      success: true,
      message: 'Payroll deleted successfully!',
      data: payroll,
    };
  }

  /**
   * Bulk Delete payroll
   * @param body
   * @returns { count: number }
   */
  @ApiOkResponse({
    description: 'Payroll bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Accounts deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('payroll-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@Body() body: BlukDeleteIdsDto) {
    const data = await this.payrollsService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Payroll deleted successfully!',
      data: data,
    };
  }
}
