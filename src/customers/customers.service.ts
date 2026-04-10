import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomerDto } from './schemas/customer.schema';
import { BlukDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all customer
   * @param param0
   * @returns Customer
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
  }): Promise<{ items: Customer[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        include: {
          customerGroup: {
            select: {
              id: true,
              groupName: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find customer by id
   * @param id
   * @returns Customer
   */
  async findOne(id: number): Promise<Customer | null> {
    return await this.prisma.customer.findUnique({
      where: { id },
      include: {
        customerGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
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
   * Create new customer
   * @param customerDto
   * @returns Customer
   */
  async create(
    customerDto: CustomerDto,
    creatorEmail: string,
  ): Promise<Customer> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');
    return this.prisma.customer.create({
      data: { ...customerDto, createdBy: creator?.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        customerGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
      },
    });
  }

  /**
   * Update customer by id
   * @param id
   * @param customerDto
   * @returns Customer
   */
  async update(
    id: number,
    customerDto: CustomerDto,
    updatorEmail: string,
  ): Promise<Customer> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.customer.update({
      where: { id },
      data: { ...customerDto, updatedBy: updator?.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        customerGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
      },
    });
  }

  /**
   * Delete customer by ID
   * @param id Customer ID
   * @returns Customer
   */
  async remove(id: number): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!customer) throw new NotFoundException('Customer not found.');

    return this.prisma.customer.delete({ where: { id } });
  }

  /**
   * Bulk delete customers
   * @param ids Customer IDs
   * @returns Number
   */
  async bulkDelete(ids: BlukDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.customer.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
