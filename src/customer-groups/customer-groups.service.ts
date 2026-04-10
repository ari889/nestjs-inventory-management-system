import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerGroup } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BlukDeleteCustomerGroupDto,
  CustomerGroupDto,
} from './dto/customer-group.dto';

@Injectable()
export class CustomerGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Customer Groups
   * @param param0
   * @returns CustomerGroup
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
  }): Promise<{ items: CustomerGroup[]; totalItems: number }> {
    const where = search
      ? {
          groupName: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.customerGroup.findMany({
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
      this.prisma.customerGroup.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Customer Group find by id
   * @param id
   * @returns CustomerGroup
   */
  async findOne(
    id: number,
  ): Promise<Omit<CustomerGroup, 'createdBy' | 'updatedBy'>> {
    const customerGroup = await this.prisma.customerGroup.findUnique({
      where: { id },
      select: {
        id: true,
        groupName: true,
        percentage: true,
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
    if (!customerGroup)
      throw new NotFoundException('Customer Group not found.');
    return customerGroup;
  }

  /**
   * Create new Customer Group
   * @param customerGroupDto
   * @param creatorEmail
   * @return CustomerGroup
   */
  async create(
    customerGroupDto: CustomerGroupDto,
    creatorEmail: string,
  ): Promise<CustomerGroup> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.customerGroup.create({
      data: {
        ...customerGroupDto,
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
   * Update Customer Group by id
   * @param id
   * @param updatorEmail
   * @param customerGroupDto
   * @returns CustomerGroup
   */
  async update(
    id: number,
    updatorEmail: string,
    customerGroupDto: CustomerGroupDto,
  ): Promise<CustomerGroup> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator)
      throw new NotFoundException('Updator customer group not found!');

    return this.prisma.customerGroup.update({
      where: { id },
      data: { ...customerGroupDto, updatedBy: updator.id },
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
   * Delete customer group by Id
   * @param id
   * @returns CustomerGroup
   */
  async remove(id: number): Promise<CustomerGroup> {
    const customerGroup = await this.prisma.customerGroup.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!customerGroup)
      throw new NotFoundException('Customer Group not found.');

    return this.prisma.customerGroup.delete({ where: { id } });
  }

  /**
   * Bulk delete customer group by ids
   * @param ids
   * @returns CustomerGroup
   */
  async bulkDelete(
    ids: BlukDeleteCustomerGroupDto['ids'],
  ): Promise<{ count: number }> {
    return this.prisma.customerGroup.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
