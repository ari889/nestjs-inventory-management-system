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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PurchasesService } from './purchases.service';
import { Permission } from 'src/common/decorators/permission.decorator';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { PurchaseSchema } from './schemas/purchase.schema';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto/purchase.dto';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';
import {
  type PurchaseQueryDto,
  PurchaseQuerySchema,
} from './schemas/purchase-query.schema';

const purchaseProductProperties = {
  id: { type: 'number', example: 1 },
  purchaseId: { type: 'number', example: 1 },
  productId: { type: 'number', example: 1 },
  unitId: { type: 'number', example: 1 },
  qty: { type: 'string', example: '10.00' },
  received: { type: 'string', example: '10.00' },
  netUnitCost: { type: 'string', example: '50.00' },
  discount: { type: 'string', example: '5.00' },
  taxRate: { type: 'string', example: '10.00' },
  tax: { type: 'string', example: '5.00' },
  total: { type: 'string', example: '100.00' },
  createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
  updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
};

const purchaseProperties = {
  id: { type: 'number', example: 1 },
  purchaseNo: { type: 'string', example: 'PUR-1710000000000' },
  supplier: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Supplier 1' },
    },
  },
  warehouse: {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: 'Warehouse 1' },
    },
  },
  item: { type: 'number', example: 3 },
  totalQty: { type: 'number', example: 10 },
  totalDiscount: { type: 'string', example: '10.00' },
  totalTax: { type: 'string', example: '5.00' },
  totalCost: { type: 'string', example: '100.00' },
  orderTaxRate: { type: 'string', example: '5.00' },
  orderTax: { type: 'string', example: '5.00' },
  orderDiscount: { type: 'string', example: '10.00' },
  shippingCost: { type: 'string', example: '20.00' },
  grandTotal: { type: 'string', example: '115.00' },
  paidAmount: { type: 'string', example: '50.00' },
  purchaseStatus: { type: 'string', example: 'RECEIVED' },
  paymentStatus: { type: 'boolean', example: false },
  document: {
    type: 'string',
    example: '/uploads/purchases/file.jpg',
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
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  /**
   * Find All Purchases
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
  @ApiQuery({ name: 'supplierId', required: false, type: Number })
  @ApiQuery({ name: 'warehouseId', required: false, type: Number })
  @ApiOkResponse({
    description: 'Purchases fetched successfull response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Purchases fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: purchaseProperties,
              },
            },
            totalItems: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  @Permission('purchase-access')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(PurchaseQuerySchema)) query: PurchaseQueryDto,
  ) {
    const data = await this.purchasesService.findAll(query);
    return {
      success: true,
      message: 'Purchases fetched successfully!',
      data,
    };
  }

  /**
   * Purchase Details by Id
   */
  @ApiOkResponse({
    description: 'Purchase fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Purchase fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            ...purchaseProperties,
            purchaseProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: purchaseProductProperties,
              },
            },
          },
        },
      },
    },
  })
  @Permission('purchase-view')
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number) {
    const purchase = await this.purchasesService.findOne(id);
    return {
      success: true,
      message: 'Purchase fetched successfully!',
      data: purchase,
    };
  }

  /**
   * Create a Purchase
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreatePurchaseDto,
    description: 'Purchase creation payload with optional document file',
  })
  @ApiOkResponse({
    description: 'Purchase created successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Purchase created successfully!' },
        data: {
          type: 'object',
          properties: purchaseProperties,
        },
      },
    },
  })
  @Permission('purchase-create')
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  async create(
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles() files: { document?: MemoryStorageFile[] },
    @Req() req: FastifyRequest,
  ) {
    const creatorEmail = req?.user?.email;
    const validated = new ZodValidationPipe(PurchaseSchema).transform({
      ...body,
      products:
        typeof body.products === 'string'
          ? (JSON.parse(body.products) as unknown)
          : body.products,
      status: body.status === 'true' || body.status === true,
      document: files.document?.[0],
    }) as CreatePurchaseDto;

    const purchase = await this.purchasesService.create(
      validated,
      creatorEmail,
      validated.document,
    );

    return {
      success: true,
      message: 'Purchase created successfully!',
      data: purchase,
    };
  }

  /**
   * Update Purchase by Id
   */
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdatePurchaseDto,
    description: 'Purchase update payload with optional document file',
  })
  @ApiOkResponse({
    description: 'Purchase updated successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Purchase updated successfully!' },
        data: {
          type: 'object',
          properties: purchaseProperties,
        },
      },
    },
  })
  @Permission('purchase-edit')
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @FormBody() body: Record<string, unknown>,
    @UploadedFiles() files: { document?: MemoryStorageFile[] },
    @Req() req: FastifyRequest,
  ) {
    const validated = new ZodValidationPipe(PurchaseSchema).transform({
      ...body,
      products:
        typeof body.products === 'string'
          ? (JSON.parse(body.products) as unknown)
          : body.products,
      status: body.status === 'true' || body.status === true,
      document: files.document?.[0],
    }) as UpdatePurchaseDto;

    const purchase = await this.purchasesService.update(
      id,
      validated,
      req?.user?.email,
      validated.document,
    );

    return {
      success: true,
      message: 'Purchase updated successfully!',
      data: purchase,
    };
  }

  /**
   * Delete Purchase by Id
   */
  @ApiOkResponse({
    description: 'Purchase deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Purchase deleted successfully!' },
        data: {
          type: 'object',
          properties: purchaseProperties,
        },
      },
    },
  })
  @Permission('purchase-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const purchase = await this.purchasesService.remove(id);
    return {
      success: true,
      message: 'Purchase deleted successfully!',
      data: purchase,
    };
  }

  /**
   * Bulk Delete Purchases
   */
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
  @ApiOkResponse({
    description: 'Purchases bulk deleted successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Purchases deleted successfully!' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @Permission('purchase-bulk-delete')
  @Delete('bulk')
  async bulkDelete(@FormBody() body: BulkDeleteIdsDto) {
    if (!Array.isArray(body?.ids))
      throw new BadRequestException('ids must be an array');
    const purchases = await this.purchasesService.bulkDelete(body.ids);
    return {
      success: true,
      message: 'Purchases deleted successfully!',
      data: purchases,
    };
  }
}
