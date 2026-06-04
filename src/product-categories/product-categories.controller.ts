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
import { ProductCategoriesService } from './product-categories.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  type ProductCategoryDto,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import type { FastifyRequest } from 'fastify';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  /**
   * Get all product categories
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @param search
   * @returns ProductCategory
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
    description: 'Product categories fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product categories fetched successfully!',
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
  @Permission('product-category-access')
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
    const productCategories = await this.productCategoriesService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Product categories fetched successfully!',
      data: productCategories,
    };
  }

  /**
   * Get product category by id
   * @param id
   * @returns ProductCategory
   */
  @ApiOkResponse({
    description: 'Get single product category successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product category fetched successfully!',
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
  @Permission('product-category-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const productCategory = await this.productCategoriesService.findOne(id);
    if (!productCategory)
      throw new NotFoundException('Product category not found.');
    return {
      success: true,
      message: 'Product category fetched successfully!',
      data: productCategory,
    };
  }

  /**
   * Create product category
   * @param productCategoryDto
   * @returns ProductCategory
   */

  @ApiOkResponse({
    description: 'Product category created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product category created successfully!',
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
  @Permission('product-category-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(ProductCategorySchema))
    productCategoryDto: ProductCategoryDto,
    @Req() req: FastifyRequest,
  ) {
    const productCategory = await this.productCategoriesService.create(
      productCategoryDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Product category created successfully!',
      data: productCategory,
    };
  }

  /**
   * Update product category by id
   * @param id
   * @param productCategoryDto
   * @returns ProductCategory
   */
  @ApiOkResponse({
    description: 'Product category updated successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product category updated successfully!',
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
  @Permission('product-category-edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody(new ZodValidationPipe(ProductCategorySchema))
    productCategoryDto: ProductCategoryDto,
    @Req() req: FastifyRequest,
  ) {
    const productCategory = await this.productCategoriesService.update(
      id,
      productCategoryDto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Product category updated successfully!',
      data: productCategory,
    };
  }

  /**
   * Delete product category by id
   * @param id
   * @returns ProductCategory
   */
  @ApiOkResponse({
    description: 'Product category deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product category fetched successfully!',
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
  @Permission('product-category-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const productCategory = await this.productCategoriesService.remove(id);
    return {
      success: true,
      message: 'Product category deleted successfully!',
      data: productCategory,
    };
  }

  /**
   * Bulk Delete product categories
   * @param body
   * @returns { count: number }
   */
  @ApiOkResponse({
    description: 'Product category bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product Categories deleted successfully!',
        },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('product-category-bulk-delete')
  @Delete('bulk')
  async bulkDeletePermission(@FormBody() body: BulkDeleteIdsDto) {
    const data = await this.productCategoriesService.bulkDelete(body?.ids);
    return {
      success: true,
      message: 'Product categories deleted successfully!',
      data: data,
    };
  }
}
