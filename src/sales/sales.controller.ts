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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import { SortDirection } from 'src/@types/default.types';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { SaleCreateSchema, SaleUpdateSchema } from './schemas/sale.schema';
import { FormBody } from 'src/common/decorators/form-body.decorator';

const saleProductSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    saleId: { type: 'number', example: 1 },
    productId: { type: 'number', example: 1 },
    unitId: { type: 'number', example: 1 },
    qty: { type: 'string', example: '10.00' },
    taxId: { type: 'number', example: 1 },
    taxRate: { type: 'string', example: '10.00' },
    tax: { type: 'string', example: '5.00' },
    netUnitPrice: { type: 'string', example: '50.00' },
    discount: { type: 'string', example: '5.00' },
    total: { type: 'string', example: '100.00' },
    createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
  },
};

const saleSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    saleNo: { type: 'string', example: 'PUR-1710000000000' },
    customerId: { type: 'number', example: 1 },
    warehouseId: { type: 'number', example: 1 },
    item: { type: 'number', example: 3 },
    totalQty: { type: 'number', example: 10 },
    totalDiscount: { type: 'string', example: '10.00' },
    totalTax: { type: 'string', example: '5.00' },
    totalPrice: { type: 'string', example: '100.00' },
    orderTaxRate: { type: 'string', example: '5.00' },
    orderTax: { type: 'string', example: '5.00' },
    orderDiscount: { type: 'string', example: '10.00' },
    shippingCost: { type: 'string', example: '20.00' },
    grandTotal: { type: 'string', example: '115.00' },
    taxId: { type: 'number', example: 1 },
    paidAmount: { type: 'string', example: '50.00' },
    saleStatus: { type: 'boolean', example: true },
    paymentStatus: { type: 'string', example: 'PAID' },
    document: {
      type: 'string',
      example: '/uploads/sales/file.jpg',
      nullable: true,
    },
    note: { type: 'string', example: 'Some note', nullable: true },
    status: { type: 'boolean', example: true },
    creator: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe' },
      },
    },
    saleProducts: {
      type: 'array',
      items: saleProductSchema,
    },
    createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
  },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Find All Sales
   */
  @ApiQuery({ name: 'page', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'order', required: false, example: 'id' })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'PUR-' })
  @ApiOkResponse({
    description: 'Sales fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sales fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array', items: saleSchema },
            totalItems: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  @Permission('sale-access')
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
    @Query('search') search?: string,
  ) {
    const data = await this.salesService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
    return {
      success: true,
      message: 'Sales fetched successfully!',
      data,
    };
  }

  /**
   * Sale Details by Id
   */
  @ApiOkResponse({
    description: 'Sale fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sale fetched successfully!' },
        data: saleSchema,
      },
    },
  })
  @Permission('sale-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const sale = await this.salesService.findOne(id);
    return {
      success: true,
      message: 'Sale fetched successfully!',
      data: sale,
    };
  }

  /**
   * Create a Sale
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateSaleDto,
    description: 'Sale creation payload with optional document file',
  })
  @ApiOkResponse({
    description: 'Sale created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sale created successfully!' },
        data: saleSchema,
      },
    },
  })
  @Permission('sale-create')
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  async create(
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles() files: { document?: MemoryStorageFile[] },
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req?.user?.email;
    const validated = new ZodValidationPipe(SaleCreateSchema).transform({
      ...body,
      products:
        typeof body.products === 'string'
          ? (JSON.parse(body.products) as unknown)
          : body.products,
      saleStatus: body.saleStatus === 'true' || body.saleStatus === true, // ← was `status`
      document: files.document?.[0],
    }) as CreateSaleDto;

    const sale = await this.salesService.create(
      validated,
      creatorEmail,
      validated.document,
    );

    return {
      success: true,
      message: 'Sale created successfully!',
      data: sale,
    };
  }

  /**
   * Update Sale by Id
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateSaleDto,
    description: 'Sale update payload with optional document file',
  })
  @ApiOkResponse({
    description: 'Sale updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sale updated successfully!' },
        data: saleSchema,
      },
    },
  })
  @Permission('sale-edit')
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles() files: { document?: MemoryStorageFile[] },
    @Req() req: FastifyRequest,
  ) {
    const validated = new ZodValidationPipe(SaleUpdateSchema).transform({
      ...body,
      products:
        typeof body.products === 'string'
          ? (JSON.parse(body.products) as unknown)
          : body.products,
      status: body.status === 'true' || body.status === true,
      document: files.document?.[0],
    }) as UpdateSaleDto;

    const sale = await this.salesService.update(
      id,
      validated,
      req?.user?.email,
      validated.document,
    );

    return {
      success: true,
      message: 'Sale updated successfully!',
      data: sale,
    };
  }

  /**
   * Delete Sale by Id
   */
  @ApiOkResponse({
    description: 'Sale deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sale deleted successfully!' },
        data: saleSchema,
      },
    },
  })
  @Permission('sale-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const sale = await this.salesService.remove(id);
    return {
      success: true,
      message: 'Sale deleted successfully!',
      data: sale,
    };
  }

  /**
   * Bulk Delete Sales
   */
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
  @ApiOkResponse({
    description: 'Sales bulk deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sales deleted successfully!' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @Permission('sale-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BlukDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const sales = await this.salesService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Sales deleted successfully!',
      data: sales,
    };
  }
}
