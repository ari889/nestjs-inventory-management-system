import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PurchasePaymentsService } from './purchase-payments.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import {
  type PurchasePaymentDto,
  PurchasePaymentSchema,
} from './schema/purchase-payment.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('purchase-payments')
export class PurchasePaymentsController {
  constructor(
    private readonly purchasePaymentsService: PurchasePaymentsService,
  ) {}

  @ApiOkResponse({
    description: 'Purchase payment fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Purchase payment fetched successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            purchaseId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 1000 },
            change: { type: 'number', example: 0 },
            paymentMethod: { type: 'string', example: 'CASH' },
            paymentStatus: { type: 'boolean', example: true },
            paidAmount: { type: 'string', example: '1000.00' },
            paymentNo: { type: 'string', example: '123456' },
            note: { type: 'string', example: 'Initial balance' },
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
  @Permission('purchase-payment-view')
  @Get(':purchaseId')
  async fincAll(@Param('purchaseId', ParseIntPipe) purchaseId: number) {
    const payments = await this.purchasePaymentsService.findAll(purchaseId);
    return {
      success: true,
      message: 'Purchase payment fetched successfully!',
      data: payments,
    };
  }

  /**
   * Create purchase payment
   * @param dto
   * @returns Payment
   */
  @ApiOkResponse({
    description: 'Purchase Payment created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Purchase Payment created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            purchaseId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 1000 },
            change: { type: 'number', example: 0 },
            paymentMethod: { type: 'string', example: 'CASH' },
            paymentNo: { type: 'string', example: '123456' },
            paymentStatus: { type: 'boolean', example: true },
            paidAmount: { type: 'string', example: '1000.00' },
            note: { type: 'string', example: 'Initial balance' },
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
      required: ['accountId', 'amount', 'paymentMethod'],
      properties: {
        accountId: { type: 'number', example: 1 },
        purchaseId: { type: 'number', example: 1 },
        amount: { type: 'number', example: 1000 },
        change: { type: 'number', example: 0 },
        paymentMethod: { type: 'string', example: 'CASH' },
        paymentNo: { type: 'string', example: '123456' },
        note: { type: 'string', example: 'Initial balance' },
      },
    },
  })
  @Permission('purchase-payment-create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(PurchasePaymentSchema))
    dto: PurchasePaymentDto,
    @Req() req: FastifyRequest,
  ) {
    const purchasePayment = await this.purchasePaymentsService.create(
      dto,
      req?.user?.email,
    );
    return {
      success: true,
      message: 'Payment created successfully!',
      data: purchasePayment,
    };
  }

  /**
   * Delete purchase payment by id
   * @param id
   * @returns Payment
   */
  @ApiOkResponse({
    description: 'Purchase Payment deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Purchase payment Payload fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            purchaseId: { type: 'number', example: 1 },
            amount: { type: 'number', example: 1000 },
            change: { type: 'number', example: 0 },
            paymentMethod: { type: 'string', example: 'CASH' },
            paymentNo: { type: 'string', example: '123456' },
            paymentStatus: { type: 'boolean', example: true },
            paidAmount: { type: 'string', example: '1000.00' },
            note: { type: 'string', example: 'Initial balance' },
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
  @Permission('purchase-payment-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const account = await this.purchasePaymentsService.remove(id);
    return {
      success: true,
      message: 'Purchase payment deleted successfully!',
      data: account,
    };
  }
}
