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
import { ExpensesService } from './expenses.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type ExpenseDto, ExpenseSchema } from './schemas/expense.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type ExpenseQueryDto,
  ExpenseQuerySchema,
} from './schemas/expense-query.schema';

const expenseProperties = {
  id: { type: 'number', example: 1 },
  expenseCategory: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Expense Category 1' },
    },
  },
  warehouse: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Warehouse 1' },
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
  note: { type: 'string', example: 'Note' },
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
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  /**
   * Get all expense
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Expense
   */
  @ApiQuery({
    name: 'order',
    required: false,
    example: 'createdAt',
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
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'expenseCategoryId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'warehouseId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Expense fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Expense fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: expenseProperties,
              },
            },
            totalItems: { type: 'number' },
          },
        },
      },
    },
  })
  @Permission('expense-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(ExpenseQuerySchema)) query: ExpenseQueryDto,
  ) {
    const expense = await this.expensesService.findAll(query);
    return {
      success: true,
      message: 'Expense fetched successfully!',
      data: expense,
    };
  }

  /**
   * Get expense by id
   * @param id
   * @returns Expense
   */
  @ApiOkResponse({
    description: 'Get single expense successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            ...expenseProperties,
            note: { type: 'string', example: 'Note' },
          },
        },
      },
    },
  })
  @Permission('expense-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const expense = await this.expensesService.findOne(id);
    if (!expense) throw new NotFoundException('Expense not found.');
    return {
      success: true,
      message: 'Expense fetched successfully!',
      data: expense,
    };
  }

  /**
   * Create expense
   * @param expenseDto
   * @returns Expense
   */

  @ApiOkResponse({
    description: 'Expense created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense created successfully!',
        },
        data: {
          type: 'array',
          properties: expenseProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'expenseCategoryId',
        'warehouseId',
        'accountId',
        'amount',
        'status',
      ],
      properties: {
        expenseCategoryId: {
          type: 'number',
          example: 1,
        },
        warehouseId: {
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
        note: {
          type: 'string',
          example: 'Note',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('expense-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(ExpenseSchema))
    expenseDto: ExpenseDto,
    @Req() req: FastifyRequest,
  ) {
    const expense = await this.expensesService.create(
      expenseDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Expense created successfully!',
      data: expense,
    };
  }

  /**
   * Update expense by id
   * @param id
   * @param expenseDto
   * @returns Expense
   */
  @ApiOkResponse({
    description: 'Expense updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense updated successfully!',
        },
        data: {
          type: 'object ',
          properties: expenseProperties,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'expenseCategoryId',
        'warehouseId',
        'accountId',
        'amount',
        'status',
      ],
      properties: {
        expenseCategoryId: {
          type: 'number',
          example: 1,
        },
        warehouseId: {
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
        note: {
          type: 'string',
          example: 'Note',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('expense-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(ExpenseSchema))
    expenaseDto: ExpenseDto,
    @Req() req: FastifyRequest,
  ) {
    const expense = await this.expensesService.update(
      id,
      expenaseDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Expense updated successfully!',
      data: expense,
    };
  }

  /**
   * Delete expense by id
   * @param id
   * @returns Expense
   */
  @ApiOkResponse({
    description: 'Expense deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense fetched successfully!',
        },
        data: {
          type: 'object',
          properties: expenseProperties,
        },
      },
    },
  })
  @Permission('expense-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const expense = await this.expensesService.remove(id);
    return {
      success: true,
      message: 'Expense deleted successfully!',
      data: expense,
    };
  }

  /**
   * Bulk Delete expense
   * @param body
   * @returns { count: number }
   */
  @ApiOkResponse({
    description: 'Expense bulk deleted generated response!',
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
  @Permission('expense-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.expensesService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Expense deleted successfully!',
      data: data,
    };
  }
}
