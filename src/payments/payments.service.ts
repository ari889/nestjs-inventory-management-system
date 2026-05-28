import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentDto } from './schema/payment.schema';
import { $Enums, Payment, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all payments by purchaseId
   * @returns Payment[]
   */
  async findAll(
    id: number,
    columnName: string = 'purchaseId',
  ): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: { [columnName]: id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   *
   * @param dto
   * @param creatorEmail
   * @returns Payment
   */
  async create(
    dto: PaymentDto,
    creatorEmail: string,
  ): Promise<
    Payment & { paymentStatus: boolean | string; paidAmount: string }
  > {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: { id: true, email: true },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: dto.accountId },
      });

      if (!account) throw new NotFoundException('Account not found!');

      if (!account.status) {
        throw new UnprocessableEntityException('Account is inactive.');
      }

      const accountBalance = new Prisma.Decimal(account.initialBalance);
      const incomingAmount = new Prisma.Decimal(dto.amount);

      const lastPayment = await tx.payment.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      const nextId = (lastPayment?.id ?? 0) + 1;
      const paymentNo = `PAY-${String(nextId).padStart(6, '0')}`;

      // ─── Purchase Payment ───────────────────────────────────────────
      if (dto.purchaseId) {
        const purchase = await tx.purchase.findUnique({
          where: { id: dto.purchaseId },
        });

        if (!purchase) throw new NotFoundException('Purchase not found!');

        if (accountBalance.lessThan(incomingAmount)) {
          throw new UnprocessableEntityException(
            `Insufficient account balance. ` +
              `Available: ${accountBalance.toFixed(2)}, ` +
              `Required: ${incomingAmount.toFixed(2)}`,
          );
        }

        const grandTotal = new Prisma.Decimal(purchase.grandTotal);
        const currentPaidAmount = new Prisma.Decimal(purchase.paidAmount);
        const projectedPaidAmount = currentPaidAmount.add(incomingAmount);

        if (projectedPaidAmount.greaterThan(grandTotal)) {
          const remainingDue = grandTotal.sub(currentPaidAmount);
          throw new UnprocessableEntityException(
            `Payment amount exceeds the remaining due. ` +
              `Grand total: ${grandTotal.toFixed(2)}, ` +
              `Already paid: ${currentPaidAmount.toFixed(2)}, ` +
              `Remaining due: ${remainingDue.toFixed(2)}`,
          );
        }

        const paymentStatus = grandTotal.sub(projectedPaidAmount).equals(0);

        await Promise.all([
          tx.account.update({
            where: { id: dto.accountId },
            data: {
              initialBalance: accountBalance.sub(incomingAmount), // subtract for purchase
            },
          }),
          tx.purchase.update({
            where: { id: dto.purchaseId },
            data: {
              paidAmount: projectedPaidAmount,
              paymentStatus,
              updatedBy: creator.id,
            },
          }),
        ]);

        const payment = await tx.payment.create({
          data: {
            accountId: dto.accountId,
            purchaseId: dto.purchaseId,
            amount: incomingAmount,
            change: dto.change ? new Prisma.Decimal(dto.change) : null,
            paymentMethod: dto.paymentMethod as $Enums.PaymentMethod,
            paymentNo,
            paymentNote: dto.paymentNote ?? null,
            createdBy: creator.id,
          },
        });

        return {
          ...payment,
          paymentStatus,
          paidAmount: projectedPaidAmount.toFixed(2),
        };
      }

      // ─── Sale Payment ────────────────────────────────────────────────
      if (dto.saleId) {
        const sale = await tx.sale.findUnique({
          where: { id: dto.saleId },
        });

        if (!sale) throw new NotFoundException('Sale not found!');

        const grandTotal = new Prisma.Decimal(sale.grandTotal);
        const currentPaidAmount = new Prisma.Decimal(sale.paidAmount);
        const projectedPaidAmount = currentPaidAmount.add(incomingAmount);

        if (projectedPaidAmount.greaterThan(grandTotal)) {
          const remainingDue = grandTotal.sub(currentPaidAmount);
          throw new UnprocessableEntityException(
            `Payment amount exceeds the remaining due. ` +
              `Grand total: ${grandTotal.toFixed(2)}, ` +
              `Already paid: ${currentPaidAmount.toFixed(2)}, ` +
              `Remaining due: ${remainingDue.toFixed(2)}`,
          );
        }

        // Determine sale payment status: PAID | PARTIAL | DUE
        const remaining = grandTotal.sub(projectedPaidAmount);
        let salePaymentStatus: 'PAID' | 'PARTIAL' | 'DUE';

        if (remaining.equals(0)) {
          salePaymentStatus = 'PAID';
        } else if (projectedPaidAmount.equals(0)) {
          salePaymentStatus = 'DUE';
        } else {
          salePaymentStatus = 'PARTIAL';
        }

        await Promise.all([
          tx.account.update({
            where: { id: dto.accountId },
            data: {
              initialBalance: accountBalance.add(incomingAmount), // add for sale
            },
          }),
          tx.sale.update({
            where: { id: dto.saleId },
            data: {
              paidAmount: projectedPaidAmount,
              paymentStatus: salePaymentStatus,
              updatedBy: creator.id,
            },
          }),
        ]);

        const payment = await tx.payment.create({
          data: {
            accountId: dto.accountId,
            saleId: dto.saleId,
            amount: incomingAmount,
            change: dto.change ? new Prisma.Decimal(dto.change) : null,
            paymentMethod: dto.paymentMethod as $Enums.PaymentMethod,
            paymentNo,
            paymentNote: dto.paymentNote ?? null,
            createdBy: creator.id,
          },
        });

        return {
          ...payment,
          paymentStatus: salePaymentStatus,
          paidAmount: projectedPaidAmount.toFixed(2),
        };
      }

      throw new BadRequestException(
        'Either purchaseId or saleId must be provided.',
      );
    });
  }

  /**
   * Remove payment by id
   * @param id
   * @returns Payment
   */
  async remove(
    id: number,
  ): Promise<Payment & { paymentStatus: boolean; paidAmount: string }> {
    let paidAmount = '0.00';
    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
      });

      if (!payment) throw new NotFoundException('Payment not found.');

      let paymentStatus = false;

      if (payment.purchaseId) {
        const purchase = await tx.purchase.findUnique({
          where: { id: payment.purchaseId },
        });

        if (purchase) {
          const grandTotal = new Prisma.Decimal(purchase.grandTotal);
          const currentPaidAmount = new Prisma.Decimal(purchase.paidAmount);
          const paymentAmount = new Prisma.Decimal(payment.amount);
          const revertedPaidAmount = currentPaidAmount.sub(paymentAmount);

          if (revertedPaidAmount.lessThan(0)) {
            throw new UnprocessableEntityException(
              'Reverting this payment would result in a negative paid amount.',
            );
          }

          paidAmount = revertedPaidAmount.toFixed(2);
          paymentStatus = grandTotal.sub(revertedPaidAmount).equals(0);

          await tx.purchase.update({
            where: { id: payment.purchaseId },
            data: {
              paidAmount: revertedPaidAmount,
              paymentStatus,
            },
          });
        }
      }

      if (payment.saleId) {
        const sale = await tx.sale.findUnique({
          where: { id: payment.saleId },
        });

        if (sale) {
          const grandTotal = new Prisma.Decimal(sale.grandTotal);
          const currentPaidAmount = new Prisma.Decimal(sale.paidAmount);
          const paymentAmount = new Prisma.Decimal(payment.amount);
          const revertedPaidAmount = currentPaidAmount.sub(paymentAmount);

          if (revertedPaidAmount.lessThan(0)) {
            throw new UnprocessableEntityException(
              'Reverting this payment would result in a negative paid amount.',
            );
          }

          paidAmount = revertedPaidAmount.toFixed(2);

          // Determine sale payment status: PAID | PARTIAL | DUE
          const remaining = grandTotal.sub(revertedPaidAmount);
          let salePaymentStatus: 'PAID' | 'PARTIAL' | 'DUE';

          if (remaining.equals(0)) {
            salePaymentStatus = 'PAID';
          } else if (revertedPaidAmount.equals(0)) {
            salePaymentStatus = 'DUE';
          } else {
            salePaymentStatus = 'PARTIAL';
          }

          await tx.sale.update({
            where: { id: payment.saleId },
            data: {
              paidAmount: revertedPaidAmount,
              paymentStatus: salePaymentStatus,
            },
          });
        }
      }

      if (payment.accountId) {
        const account = await tx.account.findUnique({
          where: { id: payment.accountId },
        });

        if (account) {
          const accountBalance = new Prisma.Decimal(account.initialBalance);
          const paymentAmount = new Prisma.Decimal(payment.amount);

          // For sale payments, subtract from account (reversing the addition)
          // For purchase payments, add back to account (reversing the subtraction)
          await tx.account.update({
            where: { id: payment.accountId },
            data: {
              initialBalance: payment.saleId
                ? accountBalance.sub(paymentAmount)
                : accountBalance.add(paymentAmount),
            },
          });
        }
      }

      const deleted = await tx.payment.delete({ where: { id } });

      return {
        ...deleted,
        paymentStatus,
        paidAmount,
      };
    });
  }
}
