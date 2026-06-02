import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Permission } from 'src/common/decorators/permission.decorator';
import { type PaymentDto, PaymentSchema } from './schema/payment.schema';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import type { FastifyRequest } from 'fastify';
import { FormBody } from 'src/common/decorators/form-body.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOkResponse({
    description: 'Payment fetched successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payment fetched successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            purchaseId: { type: 'number', example: 1 },
            saleId: { type: 'number', example: 1 },
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
  @Permission('payment-view')
  @Get(':id')
  async findAll(
    @Param('id', ParseIntPipe) id: number,
    @Query('column') column: string,
  ) {
    const payments = await this.paymentsService.findAll(id, column);
    return {
      success: true,
      message: 'Payment fetched successfully!',
      data: payments,
    };
  }

  /**
   * Create payment
   * @param dto
   * @returns Payment
   */
  @ApiOkResponse({
    description: 'Payment created successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payment created successfully!',
        },
        data: {
          type: 'array',
          properties: {
            id: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            purchaseId: { type: 'number', example: 1 },
            saleId: { type: 'number', example: 1 },
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
        saleId: { type: 'number', example: 1 },
        amount: { type: 'number', example: 1000 },
        change: { type: 'number', example: 0 },
        paymentMethod: { type: 'string', example: 'CASH' },
        paymentNo: { type: 'string', example: '123456' },
        note: { type: 'string', example: 'Initial balance' },
      },
    },
  })
  @Permission('payment-create')
  @Post()
  async create(
    @FormBody(new ZodValidationPipe(PaymentSchema))
    dto: PaymentDto,
    @Req() req: FastifyRequest,
  ) {
    const payment = await this.paymentsService.create(dto, req?.user?.email);
    return {
      success: true,
      message: 'Payment created successfully!',
      data: payment,
    };
  }

  /**
   * Delete payment by id
   * @param id
   * @returns Payment
   */
  @ApiOkResponse({
    description: 'Payment deleted successful response!',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: {
          type: 'string',
          example: 'Payment Payload fetched successfully!',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            accountId: { type: 'number', example: 1 },
            purchaseId: { type: 'number', example: 1 },
            saleId: { type: 'number', example: 1 },
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
  @Permission('payment-delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const payment = await this.paymentsService.remove(id);
    return {
      success: true,
      message: 'Payment deleted successfully!',
      data: payment,
    };
  }
}
