import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from 'src/generated/prisma/client';

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
    deletable,
  }: {
    page: number;
    limit: number;
    order: string;
    direction: string;
    search?: string;
    deletable?: boolean;
  }): Promise<{ items: Menu[]; totalItems: number }> {
    const where = {
      ...(search ? { menuName: { contains: search } } : {}),
      ...(deletable !== undefined ? { deletable } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.menu.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
      }),
      this.prisma.menu.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   *
   * @param id
   * @returns Menu
   */
  async findMenu(id: number): Promise<Omit<Menu, 'createdAt' | 'updatedAt'>> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: {
        id: true,
        menuName: true,
        deletable: true,
      },
    });
    if (!menu) throw new NotFoundException('Menu not found.');
    return menu;
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
  async updateMenu(id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    return this.prisma.menu.update({ where: { id }, data: updateMenuDto });
  }

  /**
   * Delete Menu by it's id
   * @param id
   * @returns Menu
   */
  async deleteMenu(id: number): Promise<Menu> {
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

  /**
   * Bulk delete using ids
   * @param ids
   * @returns number
   */
  async bulkDeleteMenu(ids: number[]) {
    return this.prisma.menu.deleteMany({
      where: { id: { in: ids }, deletable: true },
    });
  }
}
