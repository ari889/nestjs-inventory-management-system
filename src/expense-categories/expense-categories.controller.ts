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
import { ExpenseCategoriesService } from './expense-categories.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type ExpenseCategoryDto,
  ExpenseCategorySchema,
} from './schemas/expenase-category.schema';
import type { FastifyRequest } from 'fastify';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  /**
   * Get all expense categories
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @returns ExpenseCategory
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
                  name: { type: 'string', example: 'John Doe' },
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
  @Permission('expense-category-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query('search') search?: string,
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
  ) {
    const expenseCategories = await this.expenseCategoriesService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Expense categories fetched successfully!',
      data: expenseCategories,
    };
  }

  /**
   * Get expense category by id
   * @param id
   * @returns ExpenseCategory
   */
  @ApiOkResponse({
    description: 'Get single expense category successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense category fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
  @Permission('expense-category-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const expenseCategory = await this.expenseCategoriesService.findOne(id);
    if (!expenseCategory)
      throw new NotFoundException('Expense category not found.');
    return {
      success: true,
      message: 'Expense category fetched successfully!',
      data: expenseCategory,
    };
  }

  /**
   * Create expense category
   * @param expenseCategoryDto
   * @returns ExpenseCategory
   */

  @ApiOkResponse({
    description: 'Expense category created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense category created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
      required: ['name', 'status'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('expense-category-create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(ExpenseCategorySchema))
    expenseCategoryDto: ExpenseCategoryDto,
    @Req() req: FastifyRequest,
  ) {
    const expenseCategory = await this.expenseCategoriesService.create(
      expenseCategoryDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Expense category created successfully!',
      data: expenseCategory,
    };
  }

  /**
   * Update expense category by id
   * @param id
   * @param expenseCategoryDto
   * @returns ExpenseCategory
   */
  @ApiOkResponse({
    description: 'Expense category updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense category updated successfully!',
        },
        data: {
          type: 'object ',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
      required: ['name', 'status'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @Permission('expense-category-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ExpenseCategorySchema))
    expenaseCategoryDto: ExpenseCategoryDto,
    @Req() req: FastifyRequest,
  ) {
    const expenseCategory = await this.expenseCategoriesService.update(
      id,
      expenaseCategoryDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Expense category updated successfully!',
      data: expenseCategory,
    };
  }

  /**
   * Delete expense category by id
   * @param id
   * @returns ExpenseCategory
   */
  @ApiOkResponse({
    description: 'Expense category deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Expense category fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
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
  @Permission('expense-category-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const expenseCategory = await this.expenseCategoriesService.remove(id);
    return {
      success: true,
      message: 'Expense category deleted successfully!',
      data: expenseCategory,
    };
  }

  /**
   * Bulk Delete expense categories
   * @param body
   * @returns { count: number }
   */
  @ApiOkResponse({
    description: 'Expense category bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Accounts deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('expense-category-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@Body() body: BlukDeleteIdsDto) {
    const data = await this.expenseCategoriesService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Expense categories deleted successfully!',
      data: data,
    };
  }
}
