import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Payroll, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PayrollDto } from './schemas/payroll.schema';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class PayrollsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all payrolls
   * @param param0
   * @returns Payroll[]
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
  }): Promise<{ items: Payroll[]; totalItems: number }> {
    const [items, totalItems] = await Promise.all([
      this.prisma.payroll.findMany({
        skip: page * limit,
        take: limit,
        orderBy: { [order]: direction },
        include: {
          creator: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
        },
      }),
      this.prisma.payroll.count(),
    ]);

    return { items, totalItems };
  }

  /**
   * Find payroll by id
   * @param id
   * @returns Payroll
   */
  async findOne(id: number): Promise<Payroll | null> {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Create payroll
   * @param payrollDto
   * @param creatorEmail
   * @returns Payroll
   */
  async create(payrollDto: PayrollDto, creatorEmail: string): Promise<Payroll> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: { id: true, email: true },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    const account = await this.prisma.account.findUnique({
      where: { id: payrollDto.accountId },
      select: { id: true, initialBalance: true },
    });

    if (!account) throw new NotFoundException('Account not found!');

    const balance = new Prisma.Decimal(account.initialBalance.toString());
    const amount = new Prisma.Decimal(payrollDto.amount.toString());

    if (balance.minus(amount).isNegative()) {
      throw new BadRequestException('Account balance not enough!');
    }

    return this.prisma.$transaction(async (tx) => {
      const payroll = await tx.payroll.create({
        data: { ...payrollDto, createdBy: creator.id },
        include: {
          creator: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
        },
      });

      await tx.account.update({
        where: { id: payrollDto.accountId },
        data: {
          initialBalance: balance.minus(amount),
        },
      });

      return payroll;
    });
  }

  /**
   * Update payroll by id
   * @param id
   * @param payrollDto
   * @param updatorEmail
   * @returns Payroll
   */
  async update(
    id: number,
    payrollDto: PayrollDto,
    updatorEmail: string,
  ): Promise<Payroll> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: { id: true, email: true },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    const existingPayroll = await this.prisma.payroll.findUnique({
      where: { id },
      select: { amount: true, accountId: true },
    });

    if (!existingPayroll) throw new NotFoundException('Payroll not found!');

    const account = await this.prisma.account.findUnique({
      where: { id: payrollDto.accountId },
      select: { id: true, initialBalance: true },
    });

    if (!account) throw new NotFoundException('Account not found!');

    const currentBalance = new Prisma.Decimal(
      account.initialBalance.toString(),
    );
    const oldAmount = new Prisma.Decimal(existingPayroll.amount.toString());
    const newAmount = new Prisma.Decimal(payrollDto.amount.toString());

    const restoredBalance = currentBalance.plus(oldAmount);
    const finalBalance = restoredBalance.minus(newAmount);

    if (finalBalance.isNegative()) {
      throw new BadRequestException('Account balance not enough!');
    }

    return this.prisma.$transaction(async (tx) => {
      const payroll = await tx.payroll.update({
        where: { id },
        data: { ...payrollDto, updatedBy: updator.id },
        include: {
          creator: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
        },
      });

      if (existingPayroll.accountId !== payrollDto.accountId) {
        const oldAccount = await tx.account.findUnique({
          where: { id: existingPayroll.accountId },
          select: { id: true, initialBalance: true },
        });

        if (oldAccount) {
          await tx.account.update({
            where: { id: existingPayroll.accountId },
            data: {
              initialBalance: new Prisma.Decimal(
                oldAccount.initialBalance.toString(),
              ).plus(oldAmount),
            },
          });
        }

        await tx.account.update({
          where: { id: payrollDto.accountId },
          data: { initialBalance: currentBalance.minus(newAmount) },
        });
      } else {
        await tx.account.update({
          where: { id: payrollDto.accountId },
          data: { initialBalance: finalBalance },
        });
      }

      return payroll;
    });
  }

  /**
   * Remove payroll by id
   * @param id
   * @returns Payroll
   */
  async remove(id: number): Promise<Payroll> {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      select: { id: true, amount: true, accountId: true },
    });

    if (!payroll) throw new NotFoundException('Payroll not found.');

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.payroll.delete({ where: { id } });

      await tx.account.update({
        where: { id: payroll.accountId },
        data: {
          initialBalance: {
            increment: new Prisma.Decimal(payroll.amount.toString()),
          },
        },
      });

      return deleted;
    });
  }

  /**
   * Bulk delete Payroll
   * @param ids
   * @returns Payroll
   */
  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    const payrolls = await this.prisma.payroll.findMany({
      where: { id: { in: ids } },
      select: { id: true, amount: true, accountId: true },
    });

    if (!payrolls.length) throw new NotFoundException('No payrolls found.');

    const accountRestoreMap = new Map<number, Prisma.Decimal>();

    for (const payroll of payrolls) {
      const prev =
        accountRestoreMap.get(payroll.accountId) ?? new Prisma.Decimal(0);
      accountRestoreMap.set(
        payroll.accountId,
        prev.plus(new Prisma.Decimal(payroll.amount.toString())),
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.payroll.deleteMany({
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
