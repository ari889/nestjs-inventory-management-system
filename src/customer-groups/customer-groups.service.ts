import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomerGroup } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomerGroupQueryDto } from './schemas/customer-group-query.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { CustomerGroupDto } from './schemas/customer-group.schema';

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
    status = undefined,
    createdBy = undefined,
  }: CustomerGroupQueryDto): Promise<{
    items: Array<Omit<CustomerGroup, 'createdBy' | 'updatedBy' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        groupName: { contains: search },
      }),
      ...(status !== undefined && { status }),
      ...(createdBy && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.customerGroup.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
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
          createdAt: true,
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
  ): Promise<Omit<CustomerGroup, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
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
        createdAt: true,
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
  ): Promise<Omit<CustomerGroup, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
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
        createdAt: true,
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
  ): Promise<Omit<CustomerGroup, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
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
        createdAt: true,
      },
    });
  }

  /**
   * Delete customer group by Id
   * @param id
   * @returns CustomerGroup
   */
  async remove(
    id: number,
  ): Promise<Omit<CustomerGroup, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const customerGroup = await prisma.customerGroup.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!customerGroup)
        throw new NotFoundException('Customer Group not found.');

      const customerCount = await prisma.customer.count({
        where: { customerGroupId: id },
      });

      if (customerCount > 0)
        throw new ConflictException(
          `Cannot delete customer group. It is assigned to ${customerCount} customer(s).`,
        );

      return prisma.customerGroup.delete({
        where: { id },
        select: {
          id: true,
          groupName: true,
          percentage: true,
          status: true,
          createdAt: true,
          creator: { select: { id: true, name: true } },
        },
      });
    });
  }

  /**
   * Bulk delete customer group by ids
   * @param ids
   * @returns CustomerGroup
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const customerGroups = await prisma.customerGroup.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = customerGroups.map((cg) => cg.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException(
          'No customer groups found for the given IDs.',
        );

      const customers = await prisma.customer.groupBy({
        by: ['customerGroupId'],
        where: { customerGroupId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      customers.forEach((c) =>
        conflictMap.set(c.customerGroupId, [`${c._count} customer(s)`]),
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
          message: 'No customer groups could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.customerGroup.deleteMany({
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
