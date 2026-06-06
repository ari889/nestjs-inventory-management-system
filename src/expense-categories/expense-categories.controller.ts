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
import { ExpenseCategoriesService } from './expense-categories.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type ExpenseCategoryDto,
  ExpenseCategorySchema,
} from './schemas/expenase-category.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type ExpenseCategoryQueryDto,
  ExpenseCategoryQuerySchema,
} from './schemas/expense-category-query.schema';

const expenseCategoryProperties = {
  id: { type: 'number', example: 1 },
  name: { type: 'string', example: 'John Doe' },
  status: { type: 'boolean', example: true },
  createdAt: {
    type: 'string',
    example: '2021-01-01T00:00:00.000Z',
  },
};

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
    name: 'search',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiOkResponse({
    description: 'Expense categories fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
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
                properties: expenseCategoryProperties,
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
    @Query(new ZodValidationPipe(ExpenseCategoryQuerySchema))
    query: ExpenseCategoryQueryDto,
  ) {
    const expenseCategories =
      await this.expenseCategoriesService.findAll(query);
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
          properties: expenseCategoryProperties,
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
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Expense category created successfully!',
        },
        data: {
          type: 'array',
          properties: expenseCategoryProperties,
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
    @FormBody(new ZodValidationPipe(ExpenseCategorySchema))
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
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Expense category updated successfully!',
        },
        data: {
          type: 'object ',
          properties: expenseCategoryProperties,
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
    @FormBody(new ZodValidationPipe(ExpenseCategorySchema))
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
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Expense category fetched successfully!',
        },
        data: {
          type: 'object',
          properties: expenseCategoryProperties,
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
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Expense Categories deleted successfully!',
        },
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
  @Permission('expense-category-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.expenseCategoriesService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Expense categories deleted successfully!',
      data: data,
    };
  }
}
