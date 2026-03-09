import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Menus
   * @returns Menu
   */
  async getMenus({
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
    search: string;
  }) {
    const [items, totalItems] = await Promise.all([
      this.prisma.menu.findMany({
        where: {
          menuName: {
            contains: search,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
      }),
      this.prisma.menu.count(),
    ]);
    return {
      items,
      totalItems,
    };
  }
}
