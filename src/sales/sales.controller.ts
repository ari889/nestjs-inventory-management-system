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
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { SaleCreateSchema, SaleUpdateSchema } from './schemas/sale.schema';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type SaleQueryDto,
  SaleQuerySchema,
} from './schemas/sale-query.schema';

const saleProductProperties = {
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
};

const saleProperties = {
  id: { type: 'number', example: 1 },
  saleNo: { type: 'string', example: 'PUR-1710000000000' },
  customer: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Customer 1' },
    },
    warehouse: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Warehouse 1' },
      },
    },
  },
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
  createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
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
  @ApiQuery({ name: 'order', required: false, example: 'createdAt' })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['asc', 'desc'],
    schema: {
      default: 'desc',
      enum: ['asc', 'desc'],
    },
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'createdBy', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'warehouseId', required: false, type: Number })
  @ApiOkResponse({
    description: 'Sales fetched successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sales fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: saleProperties,
              },
            },
            totalItems: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  @Permission('sale-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(SaleQuerySchema)) query: SaleQueryDto,
  ) {
    const data = await this.salesService.findAll(query);
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
        data: {
          type: 'object',
          properties: {
            ...saleProperties,

            saleProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: saleProductProperties,
              },
            },
          },
        },
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
        data: {
          type: 'object',
          properties: saleProperties,
        },
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
        data: {
          type: 'object',
          properties: saleProperties,
        },
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
        data: {
          type: 'object',
          properties: saleProperties,
        },
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
  @Permission('sale-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
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
