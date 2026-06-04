import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { responseCommonObject } from 'src/common/swagger/common';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import { ProductDto, ProductSchema } from './schemas/product.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Find All Products
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Products
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
    example: 'Product 1',
  })
  @ApiOkResponse({
    description: 'Product fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ...responseCommonObject,
                  name: {
                    type: 'string',
                    example: 'Product 1',
                  },
                  code: {
                    type: 'string',
                    example: 'P001',
                  },
                  barcodeSymbology: {
                    type: 'string',
                    example: 'C128',
                  },
                  image: {
                    type: 'string',
                    example: 'https://example.com/image.jpg',
                  },
                  brandId: {
                    type: 'number',
                    example: 1,
                  },
                  categoryId: {
                    type: 'number',
                    example: 1,
                  },
                  unitId: {
                    type: 'number',
                    example: 1,
                  },
                  purchaseUnitId: {
                    type: 'number',
                    example: 1,
                  },
                  saleUnitId: {
                    type: 'number',
                    example: 1,
                  },
                  cost: {
                    type: 'string',
                    example: '100.00',
                  },
                  price: {
                    type: 'string',
                    example: '200.00',
                  },
                  qty: {
                    type: 'number',
                    example: 10,
                  },
                  alertQty: {
                    type: 'number',
                    example: 5,
                  },
                  taxId: {
                    type: 'number',
                    example: 1,
                  },
                  taxMethod: {
                    type: 'boolean',
                    example: true, // true = Exclusive, False = Inclusive
                  },
                  description: {
                    type: 'string',
                    example: 'Product description',
                  },
                  status: {
                    type: 'boolean',
                    example: true,
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
  @Permission('product-access')
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('order') order: string = 'id',
    @Query(
      'direction',
      new DefaultValuePipe(SortDirection.DESC),
      new ParseEnumPipe(SortDirection),
    )
    direction: string = 'desc',
    @Query('search') search?: string,
  ) {
    const data = await this.productsService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Products fetched successfully!',
      data,
    };
  }

  /**
   * Product Details by Id
   * @param id
   * @returns Product
   */
  @ApiOkResponse({
    description: 'Product fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            ...responseCommonObject,
            name: {
              type: 'string',
              example: 'Product 1',
            },
            code: {
              type: 'string',
              example: 'P001',
            },
            barcodeSymbology: {
              type: 'string',
              example: 'C128',
            },
            image: {
              type: 'string',
              example: 'https://example.com/image.jpg',
            },
            brandId: {
              type: 'number',
              example: 1,
            },
            categoryId: {
              type: 'number',
              example: 1,
            },
            unitId: {
              type: 'number',
              example: 1,
            },
            purchaseUnitId: {
              type: 'number',
              example: 1,
            },
            saleUnitId: {
              type: 'number',
              example: 1,
            },
            cost: {
              type: 'string',
              example: '100.00',
            },
            price: {
              type: 'string',
              example: '200.00',
            },
            qty: {
              type: 'number',
              example: 10,
            },
            alertQty: {
              type: 'number',
              example: 5,
            },
            taxId: {
              type: 'number',
              example: 1,
            },
            taxMethod: {
              type: 'boolean',
              example: true, // true = Exclusive, False = Inclusive
            },
            description: {
              type: 'string',
              example: 'Product description',
            },
            status: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },
  })
  @Permission('product-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findOne(id);
    return {
      success: true,
      message: 'Product fetched successfully!',
      data: product,
    };
  }

  /**
   * Create a Product
   * @param createProductDto
   * @param req
   * @returns Product
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'name',
        'code',
        'barcodeSymbology',
        'categoryId',
        'unitId',
        'purchaseUnitId',
        'saleUnitId',
        'cost',
        'price',
      ],
      properties: {
        name: { type: 'string', example: 'Product 1' },
        code: { type: 'string', example: 'PRD-001' },
        barcodeSymbology: { type: 'string', example: 'CODE128' },
        image: { type: 'string', format: 'binary' },
        brandId: { type: 'integer', example: 1 },
        categoryId: { type: 'integer', example: 1 },
        unitId: { type: 'integer', example: 1 },
        purchaseUnitId: { type: 'integer', example: 1 },
        saleUnitId: { type: 'integer', example: 1 },
        cost: { type: 'number', example: 100.0 },
        price: { type: 'number', example: 150.0 },
        qty: { type: 'integer', example: 50 },
        alertQty: { type: 'integer', example: 10 },
        taxId: { type: 'integer', example: 1 },
        taxMethod: {
          type: 'boolean',
          example: true,
          description: 'true = Exclusive, false = Inclusive',
        },
        description: { type: 'string', example: 'Product description here' },
        status: {
          type: 'boolean',
          example: true,
          description: 'true = Active, false = Inactive',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Product created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Product created successfully!',
        },
        data: {
          type: 'object',
          properties: {
            ...responseCommonObject,
            name: {
              type: 'string',
              example: 'Product 1',
            },
            code: {
              type: 'string',
              example: 'P001',
            },
            barcodeSymbology: {
              type: 'string',
              example: 'C128',
            },
            image: {
              type: 'string',
              example: 'https://example.com/image.jpg',
            },
            brandId: {
              type: 'number',
              example: 1,
            },
            categoryId: {
              type: 'number',
              example: 1,
            },
            unitId: {
              type: 'number',
              example: 1,
            },
            purchaseUnitId: {
              type: 'number',
              example: 1,
            },
            saleUnitId: {
              type: 'number',
              example: 1,
            },
            cost: {
              type: 'string',
              example: '100.00',
            },
            price: {
              type: 'string',
              example: '200.00',
            },
            qty: {
              type: 'number',
              example: 10,
            },
            alertQty: {
              type: 'number',
              example: 5,
            },
            taxId: {
              type: 'number',
              example: 1,
            },
            taxMethod: {
              type: 'boolean',
              example: true, // true = Exclusive, False = Inclusive
            },
            description: {
              type: 'string',
              example: 'Product description',
            },
            status: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },
  })
  @Permission('product-create')
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async create(
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      image?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req?.user?.email;
    const validated = new ZodValidationPipe(ProductSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as ProductDto;

    const product = await this.productsService.create(
      validated,
      creatorEmail,
      validated.image,
    );

    return {
      success: true,
      message: 'Product created successfully!',
      data: product,
    };
  }

  /**
   * Product update by id
   * @param id
   * @param productDto
   * @param req
   * @returns Product
   */
  @ApiOkResponse({
    description: 'Product update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product updated successfully!' },
        data: {
          type: 'object',
          properties: {
            ...responseCommonObject,
            name: {
              type: 'string',
              example: 'Product 1',
            },
            code: {
              type: 'string',
              example: 'P001',
            },
            barcodeSymbology: {
              type: 'string',
              example: 'C128',
            },
            image: {
              type: 'string',
              example: 'https://example.com/image.jpg',
            },
            brandId: {
              type: 'number',
              example: 1,
            },
            categoryId: {
              type: 'number',
              example: 1,
            },
            unitId: {
              type: 'number',
              example: 1,
            },
            purchaseUnitId: {
              type: 'number',
              example: 1,
            },
            saleUnitId: {
              type: 'number',
              example: 1,
            },
            cost: {
              type: 'string',
              example: '100.00',
            },
            price: {
              type: 'string',
              example: '200.00',
            },
            qty: {
              type: 'number',
              example: 10,
            },
            alertQty: {
              type: 'number',
              example: 5,
            },
            taxId: {
              type: 'number',
              example: 1,
            },
            taxMethod: {
              type: 'boolean',
              example: true, // true = Exclusive, False = Inclusive
            },
            description: {
              type: 'string',
              example: 'Product description',
            },
            status: {
              type: 'boolean',
              example: true,
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
        'name',
        'code',
        'barcodeSymbology',
        'categoryId',
        'unitId',
        'purchaseUnitId',
        'saleUnitId',
        'cost',
        'price',
      ],
      properties: {
        name: { type: 'string', example: 'Product 1' },
        code: { type: 'string', example: 'PRD-001' },
        barcodeSymbology: { type: 'string', example: 'CODE128' },
        image: { type: 'string', format: 'binary' },
        brandId: { type: 'integer', example: 1 },
        categoryId: { type: 'integer', example: 1 },
        unitId: { type: 'integer', example: 1 },
        purchaseUnitId: { type: 'integer', example: 1 },
        saleUnitId: { type: 'integer', example: 1 },
        cost: { type: 'number', example: 100.0 },
        price: { type: 'number', example: 150.0 },
        qty: { type: 'integer', example: 50 },
        alertQty: { type: 'integer', example: 10 },
        taxId: { type: 'integer', example: 1 },
        taxMethod: {
          type: 'boolean',
          example: true,
          description: 'true = Exclusive, false = Inclusive',
        },
        description: { type: 'string', example: 'Product description here' },
        status: {
          type: 'boolean',
          example: true,
          description: 'true = Active, false = Inactive',
        },
      },
    },
  })
  @Permission('product-edit')
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      image?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const validated = new ZodValidationPipe(ProductSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as ProductDto;
    const product = await this.productsService.update(
      id,
      validated,
      req?.user?.email,
      validated.image,
    );
    return {
      success: true,
      message: 'Product updated successfully!',
      data: product,
    };
  }

  /**
   * Delete Product by Id
   * @param id
   * @returns Product
   */
  @ApiOkResponse({
    description: 'Product deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Products deleted successfully!',
        },
        data: {
          type: 'object',
          properties: {
            ...responseCommonObject,
            name: {
              type: 'string',
              example: 'Product 1',
            },
            code: {
              type: 'string',
              example: 'P001',
            },
            barcodeSymbology: {
              type: 'string',
              example: 'C128',
            },
            image: {
              type: 'string',
              example: 'https://example.com/image.jpg',
            },
            brandId: {
              type: 'number',
              example: 1,
            },
            categoryId: {
              type: 'number',
              example: 1,
            },
            unitId: {
              type: 'number',
              example: 1,
            },
            purchaseUnitId: {
              type: 'number',
              example: 1,
            },
            saleUnitId: {
              type: 'number',
              example: 1,
            },
            cost: {
              type: 'string',
              example: '100.00',
            },
            price: {
              type: 'string',
              example: '200.00',
            },
            qty: {
              type: 'number',
              example: 10,
            },
            alertQty: {
              type: 'number',
              example: 5,
            },
            taxId: {
              type: 'number',
              example: 1,
            },
            taxMethod: {
              type: 'boolean',
              example: true, // true = Exclusive, False = Inclusive
            },
            description: {
              type: 'string',
              example: 'Product description',
            },
            status: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },
  })
  @Permission('product-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findOne(id);
    await this.productsService.remove(id);
    return {
      success: true,
      message: 'Product deleted successfully!.',
      data: product,
    };
  }

  /**
   * Bulk delete products
   * @param body
   * @returns Products
   */
  @ApiOkResponse({
    description: 'Products bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Products deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('product-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const products = await this.productsService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Products deleted successfully!',
      data: products,
    };
  }
}
