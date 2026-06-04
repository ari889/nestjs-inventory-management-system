import { Injectable, NotFoundException } from '@nestjs/common';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { Expense } from 'src/generated/prisma/client';
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

    return this.prisma.expense.create({
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
      select: { id: true },
    });

    if (!existingExpense) throw new NotFoundException('Expense not found!');

    return await this.prisma.expense.update({
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

    return this.prisma.expense.delete({ where: { id } });
  }

  /**
   * Bulk delete expense
   * @param ids Expense IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    const expenses = await this.prisma.expense.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (!expenses.length) throw new NotFoundException('No expenses found.');

    return this.prisma.expense.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
