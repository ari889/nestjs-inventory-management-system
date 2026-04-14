import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';
import { Expense, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpenseDto } from './schemas/expense.schema';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all expense
   * @param param0
   * @returns Expense
   */
  async findAll({
    page,
    limit,
    order,
    direction,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
  }): Promise<{ items: Expense[]; totalItems: number }> {
    const [items, totalItems] = await Promise.all([
      this.prisma.expense.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          expenseCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.expenseCategory.count(),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find expense by id
   * @param id
   * @returns Expense
   */
  async findOne(id: number): Promise<Expense | null> {
    return await this.prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        expenseCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
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
   * Create new expense
   * @param expenseDto
   * @param creatorEmail
   * @returns Expense
   */
  async create(expenseDto: ExpenseDto, creatorEmail: string): Promise<Expense> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    if (!expenseDto.accountId)
      throw new BadRequestException('Account is required!');

    const account = await this.prisma.account.findUnique({
      where: { id: expenseDto.accountId },
      select: { id: true, initialBalance: true },
    });

    if (!account) throw new NotFoundException('Account not found!');

    const balance = new Prisma.Decimal(account.initialBalance.toString());
    const amount = new Prisma.Decimal(expenseDto.amount.toString());

    if (balance.minus(amount).isNegative()) {
      throw new BadRequestException('Account balance not enough!');
    }

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: { ...expenseDto, createdBy: creator.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          expenseCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.account.update({
        where: { id: expenseDto.accountId },
        data: {
          initialBalance: balance.minus(amount),
        },
      });

      return expense;
    });
  }

  /**
   * Update expense by id
   * @param id
   * @param expenseDto
   * @param updatorEmail
   * @returns Expense
   */
  async update(
    id: number,
    expenseDto: ExpenseDto,
    updatorEmail: string,
  ): Promise<Expense> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
      select: { amount: true, accountId: true },
    });

    if (!existingExpense) throw new NotFoundException('Expense not found!');

    if (!expenseDto.accountId)
      throw new BadRequestException('Account is required!');

    const account = await this.prisma.account.findUnique({
      where: { id: expenseDto.accountId },
      select: { id: true, initialBalance: true },
    });

    if (!account) throw new NotFoundException('Account not found!');

    const currentBalance = new Prisma.Decimal(
      account.initialBalance.toString(),
    );
    const oldAmount = new Prisma.Decimal(existingExpense.amount.toString());
    const newAmount = new Prisma.Decimal(expenseDto.amount.toString());

    const restoredBalance = currentBalance.plus(oldAmount);
    const finalBalance = restoredBalance.minus(newAmount);

    if (finalBalance.isNegative()) {
      throw new BadRequestException('Account balance not enough!');
    }

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: { ...expenseDto, updatedBy: updator.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          expenseCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (existingExpense.accountId !== expenseDto.accountId) {
        // Restore old amount back to the previous account
        if (existingExpense.accountId) {
          const oldAccount = await tx.account.findUnique({
            where: { id: existingExpense.accountId },
            select: { id: true, initialBalance: true },
          });

          if (oldAccount) {
            await tx.account.update({
              where: { id: existingExpense.accountId },
              data: {
                initialBalance: new Prisma.Decimal(
                  oldAccount.initialBalance.toString(),
                ).plus(oldAmount),
              },
            });
          }
        }

        // Deduct new amount from the new account
        await tx.account.update({
          where: { id: expenseDto.accountId },
          data: { initialBalance: currentBalance.minus(newAmount) },
        });
      } else {
        // Same account: restore old, deduct new
        await tx.account.update({
          where: { id: expenseDto.accountId },
          data: { initialBalance: finalBalance },
        });
      }

      return expense;
    });
  }

  /**
   * Delete expense by ID
   * @param id Expense ID
   * @returns Expense
   */
  async remove(id: number): Promise<Expense> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: { id: true, amount: true, accountId: true },
    });

    if (!expense) throw new NotFoundException('Expense not found.');

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.expense.delete({ where: { id } });

      if (expense.accountId) {
        await tx.account.update({
          where: { id: expense.accountId },
          data: {
            initialBalance: {
              increment: new Prisma.Decimal(expense.amount.toString()),
            },
          },
        });
      }

      return deleted;
    });
  }

  /**
   * Bulk delete expense
   * @param ids Expense IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    const expenses = await this.prisma.expense.findMany({
      where: { id: { in: ids } },
      select: { id: true, amount: true, accountId: true },
    });

    if (!expenses.length) throw new NotFoundException('No expenses found.');

    const accountRestoreMap = new Map<number, Prisma.Decimal>();

    for (const expense of expenses) {
      if (!expense.accountId) continue;

      const prev =
        accountRestoreMap.get(expense.accountId) ?? new Prisma.Decimal(0);
      accountRestoreMap.set(
        expense.accountId,
        prev.plus(new Prisma.Decimal(expense.amount.toString())),
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.expense.deleteMany({
        where: { id: { in: ids } },
      });

      for (const [accountId, restoreAmount] of accountRestoreMap) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            initialBalance: {
              increment: restoreAmount,
            },
          },
        });
      }

      return { count };
    });
  }
}
