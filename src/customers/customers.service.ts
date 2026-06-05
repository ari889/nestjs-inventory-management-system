import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Customer } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomerDto } from './schemas/customer.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { CustomerQueryDto } from './schemas/customer-query.schema';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all customer
   * @param param0
   * @returns Customer
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
    createdBy = undefined,
    customerGroupId = undefined,
  }: CustomerQueryDto): Promise<{
    items: Array<
      Omit<
        Customer,
        'createdBy' | 'updatedBy' | 'updatedAt' | 'customerGroupId'
      >
    >;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { companyName: { contains: search } },
          { taxNumber: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { city: { contains: search } },
          { state: { contains: search } },
          { postalCode: { contains: search } },
          { country: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(createdBy && { createdBy }),
      ...(customerGroupId && { customerGroupId }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          customerGroup: {
            select: {
              id: true,
              groupName: true,
            },
          },
          name: true,
          companyName: true,
          taxNumber: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
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
  async findOne(
    id: number,
  ): Promise<Omit<
    Customer,
    'createdBy' | 'updatedBy' | 'updatedAt' | 'customerGroupId'
  > | null> {
    return await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        customerGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
        name: true,
        companyName: true,
        taxNumber: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
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
   * Create new customer
   * @param customerDto
   * @returns Customer
   */
  async create(
    customerDto: CustomerDto,
    creatorEmail: string,
  ): Promise<
    Omit<Customer, 'createdBy' | 'updatedBy' | 'updatedAt' | 'customerGroupId'>
  > {
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
      select: {
        id: true,
        customerGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
        name: true,
        companyName: true,
        taxNumber: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
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
   * Update customer by id
   * @param id
   * @param customerDto
   * @returns Customer
   */
  async update(
    id: number,
    customerDto: CustomerDto,
    updatorEmail: string,
  ): Promise<
    Omit<Customer, 'createdBy' | 'updatedBy' | 'updatedAt' | 'customerGroupId'>
  > {
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
      select: {
        id: true,
        customerGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
        name: true,
        companyName: true,
        taxNumber: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
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
   * Delete customer by ID
   * @param id Customer ID
   * @returns Customer
   */
  async remove(
    id: number,
  ): Promise<
    Omit<Customer, 'createdBy' | 'updatedBy' | 'updatedAt' | 'customerGroupId'>
  > {
    return this.prisma.$transaction(async (prisma) => {
      const customer = await prisma.customer.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!customer) throw new NotFoundException('Customer not found.');

      const saleCount = await prisma.sale.count({
        where: { customerId: id },
      });

      if (saleCount > 0)
        throw new ConflictException(
          `Cannot delete customer. It is assigned to ${saleCount} sale(s).`,
        );

      return prisma.customer.delete({
        where: { id },
        select: {
          id: true,
          customerGroup: { select: { id: true, groupName: true } },
          name: true,
          companyName: true,
          taxNumber: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          status: true,
          creator: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    });
  }

  /**
   * Bulk delete customers
   * @param ids Customer IDs
   * @returns Number
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const customers = await prisma.customer.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = customers.map((c) => c.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No customers found for the given IDs.');

      const sales = await prisma.sale.groupBy({
        by: ['customerId'],
        where: { customerId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      sales.forEach((s) =>
        conflictMap.set(s.customerId!, [`${s._count} sale(s)`]),
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
          message: 'No customers could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.customer.deleteMany({
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
