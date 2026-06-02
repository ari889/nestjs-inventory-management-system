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
import { SortDirection } from 'src/@types/default.types';
import {
  FileFieldsInterceptor,
  MemoryStorageFile,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { PurchaseSchema } from './schemas/purchase.schema';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto/purchase.dto';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { FormBody } from 'src/common/decorators/form-body.decorator';

const purchaseProductSchema = {
  type: 'object',
  properties: {
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
  },
};

const purchaseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    purchaseNo: { type: 'string', example: 'PUR-1710000000000' },
    supplierId: { type: 'number', example: 1 },
    warehouseId: { type: 'number', example: 1 },
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
    purchaseProducts: {
      type: 'array',
      items: purchaseProductSchema,
    },
    createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
  },
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
  @ApiQuery({ name: 'order', required: false, example: 'id' })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'PUR-' })
  @ApiOkResponse({
    description: 'Purchases fetched successfully!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Purchases fetched successfully!' },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array', items: purchaseSchema },
            totalItems: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  @Permission('purchase-access')
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
    const data = await this.purchasesService.findAll({
      page,
      limit,
      order,
      direction,
      search,
    });
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
        message: { type: 'string', example: 'Purchase fetched successfully!' },
        data: purchaseSchema,
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
        data: purchaseSchema,
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
        data: purchaseSchema,
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
        data: purchaseSchema,
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
  async bulkDelete(@FormBody() body: BlukDeleteIdsDto) {
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
