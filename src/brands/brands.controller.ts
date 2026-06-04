import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
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
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { BrandDto, BrandSchema } from './schemas/brand.schema';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify/types/request';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type BrandQueryDto,
  BrandQuerySchema,
} from './schemas/brand-query.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

const brandProperties = {
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
};

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
   * @param search
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: "Brand's name",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Boolean,
  })
  @ApiOkResponse({
    description: 'Brands fetched success response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Brands fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: brandProperties,
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
    @Query(new ZodValidationPipe(BrandQuerySchema))
    query: BrandQueryDto,
  ) {
    const data = await this.brandsService.findAll(query);
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
    description: 'Brand fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Brand fetched successfully!',
        },
        data: {
          type: 'object',
          properties: brandProperties,
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
          properties: brandProperties,
        },
      },
    },
  })
  @Permission('brand-create')
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
    const validated = new ZodValidationPipe(BrandSchema).transform({
      ...body,
      status: body.status === 'true' || body.status === true,
      image: files.image?.[0],
    }) as BrandDto;

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
    description: 'Brand update generated response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: brandProperties,
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
    @FormBody() body: Record<string, unknown>,
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
    }) as BrandDto;
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
          properties: brandProperties,
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
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
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
