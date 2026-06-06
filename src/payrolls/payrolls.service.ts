import { Injectable, NotFoundException } from '@nestjs/common';
import { Payroll } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PayrollDto } from './schemas/payroll.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { PayrollQueryDto } from './schemas/payroll-query.schema';

@Injectable()
export class PayrollsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all payrolls
   * @param param0
   * @returns Payroll[]
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    employeeId = undefined,
    accountId = undefined,
    paymentMethods = undefined,
    createdBy = undefined,
  }: PayrollQueryDto): Promise<{
    items: Array<
      Omit<
        Payroll,
        'createdBy' | 'updatedBy' | 'updatedAt' | 'employeeId' | 'accountId'
      >
    >;
    totalItems: number;
  }> {
    const where = {
      ...(employeeId !== undefined && { employeeId }),
      ...(accountId !== undefined && { accountId }),
      ...(paymentMethods !== undefined && { paymentMethods }),
      ...(createdBy !== undefined && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.payroll.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: { [order]: direction },
        select: {
          id: true,
          employee: {
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
          paymentMethods: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
      }),
      this.prisma.payroll.count({ where }),
    ]);

    return { items, totalItems };
  }

  /**
   * Find payroll by id
   * @param id
   * @returns Payroll
   */
  async findOne(
    id: number,
  ): Promise<Omit<
    Payroll,
    'createdBy' | 'updatedBy' | 'updatedAt' | 'employeeId' | 'accountId'
  > | null> {
    return this.prisma.payroll.findUnique({
      where: { id },
      select: {
        id: true,
        employee: {
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
        paymentMethods: true,
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
   * Create payroll
   * @param payrollDto
   * @param creatorEmail
   * @returns Payroll
   */
  async create(
    payrollDto: PayrollDto,
    creatorEmail: string,
  ): Promise<
    Omit<
      Payroll,
      'createdBy' | 'updatedBy' | 'updatedAt' | 'employeeId' | 'accountId'
    >
  > {
    const [employee, account, creator] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: payrollDto.employeeId },
        select: { id: true },
      }),
      this.prisma.account.findUnique({
        where: { id: payrollDto.accountId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { email: creatorEmail },
        select: { id: true },
      }),
    ]);

    if (!employee) throw new NotFoundException('Employee not found.');
    if (!account) throw new NotFoundException('Account not found.');
    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.payroll.create({
      data: { ...payrollDto, createdBy: creator.id },
      select: {
        id: true,
        employee: {
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
        paymentMethods: true,
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
  ): Promise<
    Omit<
      Payroll,
      'createdBy' | 'updatedBy' | 'updatedAt' | 'employeeId' | 'accountId'
    >
  > {
    const [employee, account, updator] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: payrollDto.employeeId },
        select: { id: true },
      }),
      this.prisma.account.findUnique({
        where: { id: payrollDto.accountId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { email: updatorEmail },
        select: { id: true },
      }),
    ]);

    if (!employee) throw new NotFoundException('Employee not found.');
    if (!account) throw new NotFoundException('Account not found.');
    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.payroll.update({
      where: { id },
      data: { ...payrollDto, updatedBy: updator.id },
      select: {
        id: true,
        employee: {
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
        paymentMethods: true,
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
   * Remove payroll by id
   * @param id
   * @returns Payroll
   */
  async remove(
    id: number,
  ): Promise<
    Omit<
      Payroll,
      'createdBy' | 'updatedBy' | 'updatedAt' | 'employeeId' | 'accountId'
    >
  > {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!payroll) throw new NotFoundException('Payroll not found.');

    return this.prisma.payroll.delete({
      where: { id },
      select: {
        id: true,
        employee: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        amount: true,
        paymentMethods: true,
        creator: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  }

  /**
   * Bulk delete Payroll
   * @param ids
   * @returns Payroll
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    const payrolls = await this.prisma.payroll.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const foundIds = payrolls.map((p) => p.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(id));

    if (foundIds.length === 0)
      throw new NotFoundException('No payrolls found for the given IDs.');

    const result = await this.prisma.payroll.deleteMany({
      where: { id: { in: foundIds } },
    });

    return {
      count: result.count,
      deletedIds: foundIds,
      skippedIds: notFoundIds.map((id) => ({ id, reasons: ['Not found'] })),
    };
  }
}
