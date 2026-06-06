import {
  Controller,
  Delete,
  Get,
  NotFoundException,
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
import { PayrollsService } from './payrolls.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type PayrollDto, PayrollSchema } from './schemas/payroll.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type PayrollQueryDto,
  PayrollQuerySchema,
} from './schemas/payroll-query.schema';

const payrollProperties = {
  id: { type: 'number', example: 1 },
  employee: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'John Doe' },
    },
  },
  account: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Account 1' },
    },
  },
  amount: { type: 'number', example: 100 },
  paymentMethods: { type: 'string', example: 'CASH' },
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
    example: '2021-01-01T00:00:00.000Z',
  },
};

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
   * @param employeeId
   * @param accountId
   * @param paymentMethods
   * @param createdBy
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
    schema: {
      default: 'desc',
      enum: ['asc', 'desc'],
    },
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
    name: 'employeeId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'paymentMethods',
    required: false,
    enum: ['CASH', 'CHEQUE', 'BANK'],
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
                properties: payrollProperties,
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
    @Query(new ZodValidationPipe(PayrollQuerySchema)) query: PayrollQueryDto,
  ) {
    const payroll = await this.payrollsService.findAll(query);
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
          properties: payrollProperties,
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
          type: 'object',
          properties: payrollProperties,
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
    @FormBody(new ZodValidationPipe(PayrollSchema))
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
          properties: payrollProperties,
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
    @FormBody(new ZodValidationPipe(PayrollSchema))
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
          properties: payrollProperties,
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
  @Permission('payroll-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.payrollsService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Payroll deleted successfully!',
      data: data,
    };
  }
}
