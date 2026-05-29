import { Injectable } from '@nestjs/common';
import { round2, toNumber } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BalanceSheetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(from: Date | undefined, to: Date | undefined) {
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : undefined;

    const selectedAccounts = await this.prisma.account.findMany({
      where: {
        status: true,

        OR: [
          {
            payments: {
              some: dateFilter,
            },
          },
          {
            payrolls: {
              some: dateFilter,
            },
          },
          {
            expenses: {
              some: dateFilter,
            },
          },
        ],
      },

      select: {
        id: true,
        accountNo: true,
        initialBalance: true,
        name: true,

        payments: {
          where: dateFilter,
          select: {
            amount: true,
            purchaseId: true,
            saleId: true,
          },
        },

        payrolls: {
          where: dateFilter,
          select: {
            amount: true,
          },
        },

        expenses: {
          where: dateFilter,
          select: {
            amount: true,
          },
        },
      },
    });

    return selectedAccounts.map((account) => {
      const initialBalance = round2(toNumber(account.initialBalance));

      // DEBIT = purchase payments + payroll + expenses
      const debit = round2(
        [
          ...account.payments.filter((p) => p.purchaseId !== null),
          ...account.payrolls,
          ...account.expenses,
        ].reduce((sum, item) => {
          return sum + toNumber(item.amount);
        }, 0),
      );

      // CREDIT = sale payments
      const credit = round2(
        account.payments
          .filter((p) => p.saleId !== null)
          .reduce((sum, item) => {
            return sum + toNumber(item.amount);
          }, 0),
      );

      const balance = round2(initialBalance + credit - debit);

      return {
        id: account.id,
        accountNo: account.accountNo,
        name: account.name,
        initialBalance,
        debit,
        credit,
        balance,
      };
    });
  }
}
