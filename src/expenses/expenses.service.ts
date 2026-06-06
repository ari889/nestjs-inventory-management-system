import { Injectable, NotFoundException } from '@nestjs/common';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { Expense } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpenseDto } from './schemas/expense.schema';
import { ExpenseQueryDto } from './schemas/expense-query.schema';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all expense
   * @param param0
   * @returns Expense
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    expenseCategoryId = undefined,
    warehouseId = undefined,
    accountId = undefined,
    status = undefined,
    createdBy = undefined,
  }: ExpenseQueryDto): Promise<{
    items: Array<
      Omit<
        Expense,
        | 'createdBy'
        | 'updatedBy'
        | 'updatedAt'
        | 'note'
        | 'expenseCategoryId'
        | 'warehouseId'
        | 'accountId'
      >
    >;
    totalItems: number;
  }> {
    const where = {
      ...(expenseCategoryId !== undefined && { expenseCategoryId }),
      ...(warehouseId !== undefined && { warehouseId }),
      ...(accountId !== undefined && { accountId }),
      ...(status !== undefined && { status }),
      ...(createdBy !== undefined && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
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
          amount: true,
          status: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
      }),
      this.prisma.expense.count({ where }),
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
  async findOne(
    id: number,
  ): Promise<Omit<
    Expense,
    | 'createdBy'
    | 'updatedBy'
    | 'updatedAt'
    | 'note'
    | 'expenseCategoryId'
    | 'warehouseId'
    | 'accountId'
  > | null> {
    return await this.prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
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
        amount: true,
        note: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });
  }

  /**
   * Create new expense
   * @param expenseDto
   * @param creatorEmail
   * @returns Expense
   */
  async create(
    expenseDto: ExpenseDto,
    creatorEmail: string,
  ): Promise<
    Omit<
      Expense,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'note'
      | 'expenseCategoryId'
      | 'warehouseId'
      | 'accountId'
    >
  > {
    const [expenseCategory, warehouse, account, creator] = await Promise.all([
      this.prisma.expenseCategory.findUnique({
        where: { id: expenseDto.expenseCategoryId },
        select: { id: true },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: expenseDto.warehouseId },
        select: { id: true },
      }),
      this.prisma.account.findUnique({
        where: { id: expenseDto.accountId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      }),
    ]);

    if (!expenseCategory)
      throw new NotFoundException('Expense category not found!');
    if (!warehouse) throw new NotFoundException('Warehouse not found!');
    if (!account) throw new NotFoundException('Account not found!');
    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.expense.create({
      data: { ...expenseDto, createdBy: creator.id },
      select: {
        id: true,
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
        amount: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
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
  ): Promise<
    Omit<
      Expense,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'note'
      | 'expenseCategoryId'
      | 'warehouseId'
      | 'accountId'
    >
  > {
    const [expenseCategory, warehouse, account, updator, existingExpense] =
      await Promise.all([
        this.prisma.expenseCategory.findUnique({
          where: { id: expenseDto.expenseCategoryId },
          select: { id: true },
        }),
        this.prisma.warehouse.findUnique({
          where: { id: expenseDto.warehouseId },
          select: { id: true },
        }),
        this.prisma.account.findUnique({
          where: { id: expenseDto.accountId },
          select: { id: true },
        }),
        this.prisma.user.findUnique({
          where: { email: updatorEmail },
          select: { id: true },
        }),
        this.prisma.expense.findUnique({
          where: { id },
          select: { id: true },
        }),
      ]);

    if (!expenseCategory)
      throw new NotFoundException('Expense category not found!');
    if (!warehouse) throw new NotFoundException('Warehouse not found!');
    if (!account) throw new NotFoundException('Account not found!');
    if (!updator) throw new NotFoundException('Updator user not found!');
    if (!existingExpense) throw new NotFoundException('Expense not found!');

    return await this.prisma.expense.update({
      where: { id },
      data: { ...expenseDto, updatedBy: updator.id },
      select: {
        id: true,
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
        amount: true,
        status: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });
  }

  /**
   * Delete expense by ID
   * @param id Expense ID
   * @returns Expense
   */
  async remove(
    id: number,
  ): Promise<
    Omit<
      Expense,
      | 'createdBy'
      | 'updatedBy'
      | 'updatedAt'
      | 'note'
      | 'expenseCategoryId'
      | 'warehouseId'
      | 'accountId'
    >
  > {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!expense) throw new NotFoundException('Expense not found.');

    return this.prisma.expense.delete({
      where: { id },
      select: {
        id: true,
        expenseCategory: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        amount: true,
        status: true,
        creator: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  }

  /**
   * Bulk delete expense
   * @param ids Expense IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    const expenses = await this.prisma.expense.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const foundIds = expenses.map((e) => e.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(id));

    if (foundIds.length === 0)
      throw new NotFoundException('No expenses found for the given IDs.');

    const result = await this.prisma.expense.deleteMany({
      where: { id: { in: foundIds } },
    });

    return {
      count: result.count,
      deletedIds: foundIds,
      skippedIds: notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
    };
  }
}
