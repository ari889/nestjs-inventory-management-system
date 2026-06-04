import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupplierDto } from './schemas/supplier.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all suppliers
   * @param param0
   * @returns Supplier
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
  }): Promise<{ items: Supplier[]; totalItems: number }> {
    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const [items, totalItems] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
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
  async findOne(id: number): Promise<Supplier | null> {
    return await this.prisma.supplier.findUnique({
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
   * Create new supplier
   * @param supplierDto
   * @returns Supplier
   */
  async create(
    supplierDto: SupplierDto,
    creatorEmail: string,
  ): Promise<Supplier> {
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
   * Update supplier by id
   * @param id
   * @param supplierDto
   * @returns Supplier
   */
  async update(
    id: number,
    supplierDto: SupplierDto,
    updatorEmail: string,
  ): Promise<Supplier> {
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
   * Delete supplier by ID
   * @param id Supplier ID
   * @returns Supplier
   */
  async remove(id: number): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!supplier) throw new NotFoundException('Customer Group not found.');

    return this.prisma.supplier.delete({ where: { id } });
  }

  /**
   * Bulk delete suppliers
   * @param ids Supplier IDs
   * @returns Number
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{ count: number }> {
    return this.prisma.supplier.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
