import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockQueryDto } from './schema/stock.schema';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    page,
    limit,
    direction,
    order,
    warehouseId,
    name,
  }: StockQueryDto) {
    const where = {
      ...(warehouseId ? { warehouseId } : {}),
      ...(name
        ? {
            product: {
              name: { contains: name },
            },
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.warehouseProduct.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        where,
        select: {
          id: true,
          qty: true,
          warehouseId: true,
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: {
                select: {
                  unitName: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          warehouse: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.warehouseProduct.count({ where }),
    ]);

    return { items, totalItems };
  }
}
