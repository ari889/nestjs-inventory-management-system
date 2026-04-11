import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseCategory } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpenseCategoryDto } from './schemas/expenase-category.schema';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all expense categories
   * @param param0
   * @returns ExpenseCategory
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
  }): Promise<{ items: ExpenseCategory[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where,
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
  async findOne(id: number): Promise<ExpenseCategory | null> {
    return await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
          },
        },
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
  ): Promise<ExpenseCategory> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.expenseCategory.create({
      data: { ...expenseCategoryDto, createdBy: creator?.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
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
  ): Promise<ExpenseCategory> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.expenseCategory.update({
      where: { id },
      data: { ...expenseCategoryDto, updatedBy: updator?.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete expense category by ID
   * @param id ExpenseCategory ID
   * @returns ExpenseCategory
   */
  async remove(id: number): Promise<ExpenseCategory> {
    const expenseCategory = await this.prisma.expenseCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!expenseCategory)
      throw new NotFoundException('Expense category not found.');

    return this.prisma.expenseCategory.delete({ where: { id } });
  }

  /**
   * Bulk delete expense categories
   * @param ids ExpenseCategory IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.expenseCategory.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
