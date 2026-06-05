import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountDto } from './schemas/account.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { AccountQueryDto } from './schemas/account-query.schema';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all accounts
   * @param param0
   * @returns Account
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
    createdBy = undefined,
  }: AccountQueryDto): Promise<{
    items: Array<
      Omit<Account, 'createdBy' | 'updatedBy' | 'updatedAt' | 'note'>
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { accountNo: { contains: search } },
          { name: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(createdBy !== undefined && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          accountNo: true,
          name: true,
          initialBalance: true,
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
      this.prisma.account.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find account by id
   * @param id
   * @returns Account
   */
  async findOne(
    id: number,
  ): Promise<Omit<
    Account,
    'createdBy' | 'updatedBy' | 'updatedAt' | 'note'
  > | null> {
    return await this.prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        accountNo: true,
        name: true,
        initialBalance: true,
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
   * Create new account
   * @param accountDto
   * @returns Account
   */
  async create(
    accountDto: AccountDto,
    creatorEmail: string,
  ): Promise<Omit<Account, 'createdBy' | 'updatedBy' | 'updatedAt' | 'note'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.account.create({
      data: { ...accountDto, createdBy: creator?.id },
      select: {
        id: true,
        accountNo: true,
        name: true,
        initialBalance: true,
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
   * Update account by id
   * @param id
   * @param accountDto
   * @returns Account
   */
  async update(
    id: number,
    accountDto: AccountDto,
    updatorEmail: string,
  ): Promise<Omit<Account, 'createdBy' | 'updatedBy' | 'updatedAt' | 'note'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.account.update({
      where: { id },
      data: { ...accountDto, updatedBy: updator?.id },
      select: {
        id: true,
        accountNo: true,
        name: true,
        initialBalance: true,
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
   * Delete Account by ID
   * @param id Account ID
   * @returns Account
   */
  async remove(
    id: number,
  ): Promise<Omit<Account, 'createdBy' | 'updatedBy' | 'updatedAt' | 'note'>> {
    return this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!account) throw new NotFoundException('Account not found.');

      const [payrollCount, expenseCount, paymentCount] = await Promise.all([
        prisma.payroll.count({ where: { accountId: id } }),
        prisma.expense.count({ where: { accountId: id } }),
        prisma.payment.count({ where: { accountId: id } }),
      ]);

      const conflicts: string[] = [];
      if (payrollCount > 0) conflicts.push(`${payrollCount} payroll(s)`);
      if (expenseCount > 0) conflicts.push(`${expenseCount} expense(s)`);
      if (paymentCount > 0) conflicts.push(`${paymentCount} payment(s)`);

      if (conflicts.length > 0)
        throw new ConflictException(
          `Cannot delete account. It is assigned to: ${conflicts.join(', ')}.`,
        );

      return prisma.account.delete({
        where: { id },
        select: {
          id: true,
          accountNo: true,
          name: true,
          initialBalance: true,
          status: true,
          creator: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    });
  }

  /**
   * Bulk delete accounts
   * @param ids Acount IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const accounts = await prisma.account.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = accounts.map((a) => a.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No accounts found for the given IDs.');

      const [payrolls, expenses, payments] = await Promise.all([
        prisma.payroll.groupBy({
          by: ['accountId'],
          where: { accountId: { in: foundIds } },
          _count: true,
        }),
        prisma.expense.groupBy({
          by: ['accountId'],
          where: { accountId: { in: foundIds } },
          _count: true,
        }),
        prisma.payment.groupBy({
          by: ['accountId'],
          where: { accountId: { in: foundIds } },
          _count: true,
        }),
      ]);

      const conflictMap = new Map<number, string[]>();

      const addConflict = (accountId: number | null, label: string) => {
        if (!accountId) return;
        if (!conflictMap.has(accountId)) conflictMap.set(accountId, []);
        conflictMap.get(accountId)!.push(label);
      };

      payrolls.forEach((p) =>
        addConflict(p.accountId, `${p._count} payroll(s)`),
      );
      expenses.forEach((e) =>
        addConflict(e.accountId, `${e._count} expense(s)`),
      );
      payments.forEach((p) =>
        addConflict(p.accountId, `${p._count} payment(s)`),
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
          message: 'No accounts could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.account.deleteMany({
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
