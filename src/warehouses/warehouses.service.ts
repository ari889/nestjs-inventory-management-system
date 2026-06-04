import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Warehouse } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { WarehouseQueryDto } from './schemas/warehouse-query.schema';
import { WarehouseDto } from './schemas/warehouse.schema';
import { BulkDeleteIdsDto } from 'src/common/dto/base.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Warehouses
   * @param param0
   * @returns Warehouses
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    createdBy = undefined,
    status = undefined,
  }: WarehouseQueryDto): Promise<{
    items: Array<Omit<Warehouse, 'createdBy' | 'updatedBy' | 'updatedAt'>>;
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(createdBy && { createdBy }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          status: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.warehouse.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Warehouse find by id
   * @param id
   * @returns Warehouse
   */
  async findOne(
    id: number,
  ): Promise<Omit<Warehouse, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
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
    if (!warehouse) throw new NotFoundException('Warehouse not found.');
    return warehouse;
  }

  /**
   * Create new Warehouse
   * @param warehouseDto
   * @param creatorEmail
   * @returns Warehouse
   */
  async create(
    warehouseDto: WarehouseDto,
    creatorEmail: string,
  ): Promise<Omit<Warehouse, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const creator = await this.prisma.user.findUnique({
      where: { email: creatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!creator) throw new NotFoundException('Creator user not found!');

    return this.prisma.warehouse.create({
      data: {
        ...warehouseDto,
        createdBy: creator?.id,
        updatedBy: creator?.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
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
   * Update Warehouse by id
   * @param id
   * @param updatorEmail
   * @param userDto
   * @returns User
   */
  async update(
    id: number,
    updatorEmail: string,
    warehouseDto: WarehouseDto,
  ): Promise<Omit<Warehouse, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator user not found!');

    return this.prisma.warehouse.update({
      where: { id },
      data: { ...warehouseDto, updatedBy: updator.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
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
   * Delete Warehouse by Id
   * @param id
   * @returns Warehouse
   */
  async remove(
    id: number,
  ): Promise<Omit<Warehouse, 'createdBy' | 'updatedBy' | 'updatedAt'>> {
    return this.prisma.$transaction(async (prisma) => {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!warehouse) throw new NotFoundException('Warehouse not found.');

      const [expenseCount, purchaseCount, saleCount, warehouseProductCount] =
        await Promise.all([
          prisma.expense.count({ where: { warehouseId: id } }),
          prisma.purchase.count({ where: { warehouseId: id } }),
          prisma.sale.count({ where: { warehouseId: id } }),
          prisma.warehouseProduct.count({ where: { warehouseId: id } }),
        ]);

      const conflicts: string[] = [];
      if (expenseCount > 0) conflicts.push(`${expenseCount} expense(s)`);
      if (purchaseCount > 0) conflicts.push(`${purchaseCount} purchase(s)`);
      if (saleCount > 0) conflicts.push(`${saleCount} sale(s)`);
      if (warehouseProductCount > 0)
        conflicts.push(`${warehouseProductCount} warehouse product(s)`);

      if (conflicts.length > 0)
        throw new ConflictException(
          `Cannot delete warehouse. It is referenced in: ${conflicts.join(', ')}.`,
        );

      return prisma.warehouse.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          creator: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    });
  }

  /**
   * Bulk delete warehouses by ids
   * @param ids
   * @returns Warehouse
   */
  async bulkDelete(ids: BulkDeleteIdsDto['ids']): Promise<{
    count: number;
    deletedIds: number[];
    skippedIds: { id: number; reasons: string[] }[];
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const warehouses = await prisma.warehouse.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = warehouses.map((w) => w.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (foundIds.length === 0)
        throw new NotFoundException('No warehouses found for the given IDs.');

      const [expenses, purchases, sales, warehouseProducts] = await Promise.all(
        [
          prisma.expense.groupBy({
            by: ['warehouseId'],
            where: { warehouseId: { in: foundIds } },
            _count: true,
          }),
          prisma.purchase.groupBy({
            by: ['warehouseId'],
            where: { warehouseId: { in: foundIds } },
            _count: true,
          }),
          prisma.sale.groupBy({
            by: ['warehouseId'],
            where: { warehouseId: { in: foundIds } },
            _count: true,
          }),
          prisma.warehouseProduct.groupBy({
            by: ['warehouseId'],
            where: { warehouseId: { in: foundIds } },
            _count: true,
          }),
        ],
      );

      const conflictMap = new Map<number, string[]>();

      const addConflict = (warehouseId: number, label: string) => {
        if (!conflictMap.has(warehouseId)) conflictMap.set(warehouseId, []);
        conflictMap.get(warehouseId)!.push(label);
      };

      expenses.forEach((e) =>
        addConflict(e.warehouseId!, `${e._count} expense(s)`),
      );
      purchases.forEach((p) =>
        addConflict(p.warehouseId!, `${p._count} purchase(s)`),
      );
      sales.forEach((s) => addConflict(s.warehouseId!, `${s._count} sale(s)`));
      warehouseProducts.forEach((wp) =>
        addConflict(wp.warehouseId!, `${wp._count} warehouse product(s)`),
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
          message: 'No warehouses could be deleted.',
          skipped: skippedIds,
        });

      const result = await prisma.warehouse.deleteMany({
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
