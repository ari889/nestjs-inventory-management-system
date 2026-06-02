import {
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
import { ExpensesService } from './expenses.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { type ExpenseDto, ExpenseSchema } from './schemas/expense.schema';
import type { FastifyRequest } from 'fastify';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

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
    description: 'Expense categories fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense categories fetched successfully!',
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
                  expenseCategoryId: { type: 'number', example: 1 },
                  warehouseId: { type: 'number', example: 1 },
                  accountId: { type: 'number', example: 1 },
                  amount: { type: 'number', example: 100 },
                  note: { type: 'string', example: 'Note' },
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
  @Permission('expense-access')
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
    const expense = await this.expensesService.findAll({
      page,
      limit,
      order,
      direction,
    });
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
            id: { type: 'number', example: 1 },
            expenseCategoryId: { type: 'number', example: 1 },
            warehouseId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            note: { type: 'string', example: 'Note' },
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
          properties: {
            id: { type: 'number', example: 1 },
            expenseCategoryId: { type: 'number', example: 1 },
            warehouseId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            note: { type: 'string', example: 'Note' },
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
          properties: {
            id: { type: 'number', example: 1 },
            expenseCategoryId: { type: 'number', example: 1 },
            warehouseId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            note: { type: 'string', example: 'Note' },
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
          properties: {
            id: { type: 'number', example: 1 },
            expenseCategoryId: { type: 'number', example: 1 },
            warehouseId: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 100 },
            note: { type: 'string', example: 'Note' },
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
  @Permission('expense-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BlukDeleteIdsDto) {
    const data = await this.expensesService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Expense deleted successfully!',
      data: data,
    };
  }
}
