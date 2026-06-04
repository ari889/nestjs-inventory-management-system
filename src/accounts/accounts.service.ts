import { Injectable, NotFoundException } from '@nestjs/common';
import { Account } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountDto } from './schemas/account.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all accounts
   * @param param0
   * @returns Account
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
  }): Promise<{ items: Account[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
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
  async findOne(id: number): Promise<Account | null> {
    return await this.prisma.account.findUnique({
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
   * Create new account
   * @param accountDto
   * @returns Account
   */
  async create(accountDto: AccountDto, creatorEmail: string): Promise<Account> {
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
   * Update account by id
   * @param id
   * @param accountDto
   * @returns Account
   */
  async update(
    id: number,
    accountDto: AccountDto,
    updatorEmail: string,
  ): Promise<Account> {
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
   * Delete Account by ID
   * @param id Account ID
   * @returns Account
   */
  async remove(id: number): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!account) throw new NotFoundException('Account not found.');

    return this.prisma.account.delete({ where: { id } });
  }

  /**
   * Bulk delete accounts
   * @param ids Acount IDs
   * @returns { count: number }
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.account.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
