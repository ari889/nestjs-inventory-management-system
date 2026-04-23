import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PurchasePaymentDto } from './schema/purchase-payment.schema';
import { $Enums, Payment, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PurchasePaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all payments by purchaseId
   * @returns Payment[]
   */
  async findAll(purchaseId: number): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: { purchaseId },
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
    dto: PurchasePaymentDto,
    creatorEmail: string,
  ): Promise<Payment & { paymentStatus: boolean; paidAmount: string }> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: { id: true, email: true },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: dto.purchaseId },
      });

      if (!purchase) throw new NotFoundException('Purchase not found!');

      const account = await tx.account.findUnique({
        where: { id: dto.accountId },
      });

      if (!account) throw new NotFoundException('Account not found!');

      if (!account.status) {
        throw new UnprocessableEntityException('Account is inactive.');
      }

      const accountBalance = new Prisma.Decimal(account.initialBalance);
      const incomingAmount = new Prisma.Decimal(dto.amount);

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
            initialBalance: accountBalance.sub(incomingAmount),
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

      const lastPayment = await tx.payment.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      const nextId = (lastPayment?.id ?? 0) + 1;
      const paymentNo = `PAY-${String(nextId).padStart(6, '0')}`;

      const payment = await tx.payment.create({
        data: {
          accountId: dto.accountId,
          purchaseId: dto.purchaseId,
          amount: new Prisma.Decimal(dto.amount),
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

      if (payment.accountId) {
        const account = await tx.account.findUnique({
          where: { id: payment.accountId },
        });

        if (account) {
          const accountBalance = new Prisma.Decimal(account.initialBalance);
          const paymentAmount = new Prisma.Decimal(payment.amount);

          await tx.account.update({
            where: { id: payment.accountId },
            data: {
              initialBalance: accountBalance.add(paymentAmount),
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
