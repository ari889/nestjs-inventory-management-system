import {
  BadRequestException,
  Body,
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
import { BrandsService } from './brands.service';
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
import { BrandSchema, BrandSchemaType } from './schemas/brand.schema';
import { BlukDeleteBrandDto } from './dto/brand.dto';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify/types/request';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  /**
   * Find All Brands
   * @param page
   * @param limit
   * @param order
   * @param direction
   * @returns Brands
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
  @ApiOkResponse({
    description: 'Warehouses fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Warehouses fetched successfully!',
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
                  title: { type: 'string', example: 'Customer Group 1' },
                  image: { type: 'string', example: '/uploads/brand/1.jpg' },
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
  @Permission('brand-access')
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
  ) {
    const data = await this.brandsService.findAll({
      page,
      limit,
      order,
      direction,
    });
    return {
      success: true,
      message: 'Brands fetched successfully!',
      data,
    };
  }

  /**
   * Brand Details by Id
   * @param id
   * @returns Brand
   */
  @ApiOkResponse({
    description: 'Customer group fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Customer group fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Customer Group 1' },
            image: { type: 'string', example: '/uploads/brand/1.jpg' },
            status: { type: 'boolean', example: true },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'John Doe' },
              },
            },
            updator: {
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
            updatedAt: {
              type: 'string',
              example: '2021-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @Permission('brand-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const brand = await this.brandsService.findOne(id);
    return {
      success: true,
      message: 'Brand fetched successfully!',
      data: brand,
    };
  }

  /**
   * Create a Brand
   * @param createBrandDto
   * @param req
   * @returns Brand
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'status'],
      properties: {
        title: { type: 'string', example: 'Brand 1' },
        image: { type: 'string', format: 'binary' },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @ApiOkResponse({
    description: 'Brand created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Brand created successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Brand 1' },
            image: { type: 'string', example: '/uploads/brand/1.jpg' },
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
  @Permission('brand-create')
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async create(
    @Body() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      image?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req?.user?.email;
    const validated = new ZodValidationPipe(BrandSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as BrandSchemaType;

    const brand = await this.brandsService.create(
      validated,
      creatorEmail,
      validated.image,
    );

    return {
      success: true,
      message: 'Brand created successfully!',
      data: brand,
    };
  }

  /**
   * Brand update by id
   * @param id
   * @param brandDto
   * @param req
   * @returns Brand
   */
  @ApiOkResponse({
    description: 'Customer group update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            groupName: { type: 'string', example: 'Customer Group 1' },
            percentage: { type: 'number', example: 10 },
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
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
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
      required: ['title', 'status'],
      properties: {
        title: { type: 'string', example: 'Brand 1' },
        image: { type: 'string', format: 'binary' },
        status: { type: 'boolean', example: true },
      },
    },
  })
  @Permission('brand-edit')
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @UploadedFiles()
    files: {
      image?: MemoryStorageFile[];
    },
    @Req() req: FastifyRequest,
  ) {
    const validated = new ZodValidationPipe(BrandSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as BrandSchemaType;
    const brand = await this.brandsService.update(
      id,
      validated,
      req?.user?.email,
      validated.image,
    );
    return {
      success: true,
      message: 'Brand updated successfully!',
      data: brand,
    };
  }

  /**
   * Delete Brand by Id
   * @param id
   * @returns Brand
   */
  @ApiOkResponse({
    description: 'Brand deleted successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Brands deleted successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Brand 1' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
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
  @Permission('brand-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const brand = await this.brandsService.findOne(id);
    await this.brandsService.remove(id);
    return {
      success: true,
      message: 'Brand deleted successfully!.',
      data: brand,
    };
  }

  /**
   * Bulk delete brands
   * @param body
   * @returns Brands
   */
  @ApiOkResponse({
    description: 'Brands bulk deleted generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'Brands deleted successfully!' },
        data: { type: 'number', example: 4 },
      },
    },
  })
  @Permission('brand-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@Body() body: BlukDeleteBrandDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const brands = await this.brandsService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Brands deleted successfully!',
      data: brands,
    };
  }
}
