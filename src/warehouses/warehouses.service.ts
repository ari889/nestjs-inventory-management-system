import { Injectable, NotFoundException } from '@nestjs/common';
import { Warehouse } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlukDeleteWarehouseDto, WarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find All Warehouses
   * @param param0
   * @returns Warehouses
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
  }): Promise<{ items: Warehouse[]; totalItems: number }> {
    const [items, totalItems] = await Promise.all([
      this.prisma.warehouse.findMany({
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
      this.prisma.warehouse.count(),
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
  ): Promise<Omit<Warehouse, 'createdBy' | 'updatedBy'>> {
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
  ): Promise<Warehouse> {
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
  ): Promise<Warehouse> {
    const updator = await this.prisma.user.findUnique({
      where: { email: updatorEmail },
      select: {
        id: true,
        email: true,
      },
    });

    if (!updator) throw new NotFoundException('Updator warehouse not found!');

    return this.prisma.warehouse.update({
      where: { id },
      data: { ...warehouseDto, updatedBy: updator.id },
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
   * Delete Warehouse by Id
   * @param id
   * @returns Warehouse
   */
  async remove(id: number): Promise<Warehouse> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!warehouse) throw new NotFoundException('Warehouse not found.');

    return this.prisma.warehouse.delete({ where: { id } });
  }

  /**
   * Bulk delete warehouses by ids
   * @param ids
   * @returns Warehouse
   */
  async bulkDelete(
    ids: BlukDeleteWarehouseDto['ids'],
  ): Promise<{ count: number }> {
    return this.prisma.warehouse.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
