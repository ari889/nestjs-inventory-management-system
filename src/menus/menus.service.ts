import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

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
        skip: page * limit,
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

  /**
   * Create new menu
   * @param createMenuDto
   * @returns Menu
   */
  async createMenu(createMenuDto: CreateMenuDto) {
    return this.prisma.menu.create({ data: createMenuDto });
  }

  /**
   * Update menu by it's id
   * @param id
   * @param updateMenuDto
   * @returns Menu
   */
  async updateMenu(id: number, updateMenuDto: UpdateMenuDto) {
    return this.prisma.menu.update({ where: { id }, data: updateMenuDto });
  }

  /**
   * Delete Menu by it's id
   * @param id
   * @returns Menu
   */
  async deleteMenu(id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: { id: true, deletable: true },
    });

    if (!menu) throw new NotFoundException('Menu not found.');

    if (!menu.deletable)
      throw new ForbiddenException(
        'You have no enough permissions to do this.',
      );

    return this.prisma.menu.delete({ where: { id } });
  }
}
