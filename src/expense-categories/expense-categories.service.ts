import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategory } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpenseCategoryDto } from './schemas/expenase-category.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { ExpenseCategoryQueryDto } from './schemas/expense-category-query.schema';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all expense categories
   * @param param0
   * @returns ExpenseCategory
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
  }: ExpenseCategoryQueryDto): Promise<{
    items: Array<
      Omit<ExpenseCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        name: { contains: search },
      }),
      ...(status !== undefined && { status }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
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
      this.prisma.expenseCategory.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find expnese category by id
   * @param id
   * @returns ExpenseCategory
   */
  async findOne(
    id: number,
  ): Promise<Omit<
    ExpenseCategory,
    'createdBy' | 'updatedBy' | 'updatedAt'
  > | null> {
    return await this.prisma.expenseCategory.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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
   * Create new expense category
   * @param expenseCategoryDto
   * @returns ExpenseCategory
   */
  async create(
    expenseCategoryDto: ExpenseCategoryDto,
    creatorEmail: string,
  ): Promise<Omit<ExpenseCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.expenseCategory.create({
      data: { ...expenseCategoryDto, createdBy: creator?.id },
      select: {
        id: true,
        name: true,
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
   * Update expense category by id
   * @param id
   * @param expenseCategoryDto
   * @returns ExpenseCategory
   */
  async update(
    id: number,
    expenseCategoryDto: ExpenseCategoryDto,
    updatorEmail: string,
  ): Promise<Omit<ExpenseCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.expenseCategory.update({
      where: { id },
      data: { ...expenseCategoryDto, updatedBy: updator?.id },
      select: {
        id: true,
        name: true,
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
   * Delete expense category by ID
   * @param id ExpenseCategory ID
   * @returns ExpenseCategory
   */
  async remove(
    id: number,
  ): Promise<Omit<ExpenseCategory, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const expenseCategory = await prisma.expenseCategory.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!expenseCategory)
        throw new NotFoundException('Expense category not found.');

      const expenseCount = await prisma.expense.count({
        where: { expenseCategoryId: id },
      });

      if (expenseCount > 0)
        throw new ConflictException(
          `Cannot delete expense category. It is assigned to ${expenseCount} expense(s).`,
        );

      return prisma.expenseCategory.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          creator: { select: { id: true, email: true } },
          createdAt: true,
        },
      });
    });
  }

  /**
   * Bulk delete expense categories
   * @param ids ExpenseCategory IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const expenseCategories = await prisma.expenseCategory.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = expenseCategories.map((ec) => ec.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException(
          'No expense categories found for the given IDs.',
        );

      const expenses = await prisma.expense.groupBy({
        by: ['expenseCategoryId'],
        where: { expenseCategoryId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      expenses.forEach((e) =>
        conflictMap.set(e.expenseCategoryId!, [`${e._count} expense(s)`]),
      );

      const deletableIds = foundIds.filter((id) => !conflictMap.has(id));

      const skippedIds = [
        ...notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
        ...Array.from(conflictMap.entries()).map(([id, reasons]) => ({
          id,
          reasons,
        })),
      ];

      if (deletableIds.length === 0)
        throw new ConflictException({
          message: 'No expense categories could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.expenseCategory.deleteMany({
        where: { id: { in: deletableIds } },
      });

      return {
        count: result.count,
        deletedIds: deletableIds,
        skippedIds,
      };
    });
  }
}
