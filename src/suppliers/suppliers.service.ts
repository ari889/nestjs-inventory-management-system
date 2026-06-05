import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupplierDto } from './schemas/supplier.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';
import { SupplierQueryDto } from './schemas/supplier-query.schema';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all suppliers
   * @param param0
   * @returns Supplier
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    status = undefined,
    createdBy = undefined,
  }: SupplierQueryDto): Promise<{
    items: Array<Omit<Supplier, 'createdBy' | 'updatedBy' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { companyName: { contains: search } },
          { vatNumber: { contains: search } },
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
      ...(createdBy !== undefined && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          companyName: true,
          vatNumber: true,
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
      this.prisma.supplier.count({ where }),
    ]);

    return {
      items,
      totalItems,
    };
  }

  /**
   * Find supplier by id
   * @param id
   * @returns Supplier
   */
  async findOne(
    id: number,
  ): Promise<Omit<Supplier, 'createdBy' | 'updatedBy' | 'updatedAt'> | null> {
    return await this.prisma.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        companyName: true,
        vatNumber: true,
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
   * Create new supplier
   * @param supplierDto
   * @returns Supplier
   */
  async create(
    supplierDto: SupplierDto,
    creatorEmail: string,
  ): Promise<Omit<Supplier, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    if (supplierDto.email) {
      const isEmailExists = await this.prisma.supplier.findUnique({
        where: { email: supplierDto.email },
      });
      if (isEmailExists)
        throw new BadRequestException('Supplier email already exists!');
    }

    return this.prisma.supplier.create({
      data: { ...supplierDto, createdBy: creator?.id },
      select: {
        id: true,
        name: true,
        companyName: true,
        vatNumber: true,
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
   * Update supplier by id
   * @param id
   * @param supplierDto
   * @returns Supplier
   */
  async update(
    id: number,
    supplierDto: SupplierDto,
    updatorEmail: string,
  ): Promise<Omit<Supplier, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    if (supplierDto.email) {
      const isEmailExists = await this.prisma.supplier.findUnique({
        where: { email: supplierDto.email, NOT: { id } },
      });
      if (isEmailExists)
        throw new BadRequestException('Supplier email already exists!');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { ...supplierDto, updatedBy: updator?.id },
      select: {
        id: true,
        name: true,
        companyName: true,
        vatNumber: true,
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
   * Delete supplier by ID
   * @param id Supplier ID
   * @returns Supplier
   */
  async remove(
    id: number,
  ): Promise<Omit<Supplier, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!supplier) throw new NotFoundException('Supplier not found.');

      const purchaseCount = await prisma.purchase.count({
        where: { supplierId: id },
      });

      if (purchaseCount > 0)
        throw new ConflictException(
          `Cannot delete supplier. It is assigned to ${purchaseCount} purchase(s).`,
        );

      return prisma.supplier.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          companyName: true,
          vatNumber: true,
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
   * Bulk delete suppliers
   * @param ids Supplier IDs
   * @returns Number
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = suppliers.map((s) => s.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No suppliers found for the given IDs.');

      const purchases = await prisma.purchase.groupBy({
        by: ['supplierId'],
        where: { supplierId: { in: foundIds } },
        _count: true,
      });

      const conflictMap = new Map<number, string[]>();
      purchases.forEach((p) =>
        conflictMap.set(p.supplierId!, [`${p._count} purchase(s)`]),
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
          message: 'No suppliers could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.supplier.deleteMany({
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
