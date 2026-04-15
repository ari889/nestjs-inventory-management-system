import { Injectable, NotFoundException } from '@nestjs/common';
import { Tax } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlukDeleteTaxDto, TaxDto } from './dto/taxes.dto';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All taxes with pagination and sorting
   * @param param0
   * @returns Tax[]
   */
  async findAll({
    page,
    limit,
    order,
    direction,
    search = '',
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
  }): Promise<{ items: Tax[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.tax.findMany({
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
      this.prisma.tax.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Tax find by id
   * @param id
   * @returns Tax
   */
  async findOne(id: number): Promise<Omit<Tax, 'createdBy' | 'updatedBy'>> {
    const tax = await this.prisma.tax.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        rate: true,
        status: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!tax) throw new NotFoundException('Tax not found.');
    return tax;
  }

  /**
   * Create new Customer Group
   * @param taxDto
   * @param creatorEmail
   * @return CustomerGroup
   */
  async create(taxDto: TaxDto, creatorEmail: string): Promise<Tax> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.tax.create({
      data: {
        ...taxDto,
        createdBy: creator?.id,
        updatedBy: creator?.id,
      },
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
   * Update Tax by id
   * @param id
   * @param updatorEmail
   * @param taxDto
   * @returns Tax
   */
  async update(id: number, updatorEmail: string, taxDto: TaxDto): Promise<Tax> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator tax not found!');

    return this.prisma.tax.update({
      where: { id },
      data: { ...taxDto, updatedBy: updator.id },
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
   * Delete tax by Id
   * @param id
   * @returns Tax
   */
  async remove(id: number): Promise<Tax> {
    const tax = await this.prisma.tax.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!tax) throw new NotFoundException('Customer Group not found.');

    return this.prisma.tax.delete({ where: { id } });
  }

  /**
   * Bulk delete customer group by ids
   * @param ids
   * @returns CustomerGroup
   */
  async bulkDelete(ids: BlukDeleteTaxDto['ids']): Promise<{ count: number }> {
    return this.prisma.tax.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
