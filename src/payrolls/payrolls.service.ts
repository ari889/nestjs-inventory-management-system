import { Injectable, NotFoundException } from '@nestjs/common';
import { Payroll } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PayrollDto } from './schemas/payroll.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

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

    return this.prisma.payroll.create({
      data: { ...payrollDto, createdBy: creator.id },
      include: {
        creator: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
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
  ): Promise<Payroll> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: { id: true, email: true },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.payroll.update({
      where: { id },
      data: { ...payrollDto, updatedBy: updator.id },
      include: {
        creator: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
      },
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

    return this.prisma.payroll.delete({ where: { id } });
  }

  /**
   * Bulk delete Payroll
   * @param ids
   * @returns Payroll
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    const payrolls = await this.prisma.payroll.findMany({
      where: { id: { in: ids } },
      select: { id: true, amount: true, accountId: true },
    });

    if (!payrolls.length) throw new NotFoundException('No payrolls found.');

    return this.prisma.payroll.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
