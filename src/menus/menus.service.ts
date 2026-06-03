import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from 'src/generated/prisma/client';
import { MenuQueryDto } from './schemas/menu-query.schema';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Menus
   * @returns Menu
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    deletable = undefined,
  }: MenuQueryDto): Promise<{
    items: Omit<Menu, 'updatedAt'>[];
    totalItems: number;
  }> {
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
        select: {
          id: true,
          menuName: true,
          deletable: true,
          createdAt: true,
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
  async find(id: number): Promise<Omit<Menu, 'updatedAt'>> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: {
        id: true,
        menuName: true,
        deletable: true,
        createdAt: true,
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
  async create(createMenuDto: CreateMenuDto): Promise<Omit<Menu, 'updatedAt'>> {
    return this.prisma.menu.create({
      data: createMenuDto,
      select: { id: true, menuName: true, deletable: true, createdAt: true },
    });
  }

  /**
   * Update menu by it's id
   * @param id
   * @param updateMenuDto
   * @returns Menu
   */
  async update(
    id: number,
    updateMenuDto: UpdateMenuDto,
  ): Promise<Omit<Menu, 'updatedAt'>> {
    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
      select: { id: true, menuName: true, deletable: true, createdAt: true },
    });
  }

  /**
   * Delete Menu by it's id
   * @param id
   * @returns Menu
   */
  async remove(id: number): Promise<Omit<Menu, 'updatedAt'>> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: {
        id: true,
        deletable: true,
        _count: { select: { modules: true } },
      },
    });

    if (!menu) throw new NotFoundException('Menu not found.');

    if (!menu.deletable)
      throw new ForbiddenException(
        'You have no enough permissions to do this.',
      );

    if (menu?._count?.modules > 0) {
      throw new BadRequestException(
        'Cannot delete menu with existing modules.',
      );
    }

    return this.prisma.menu.delete({
      where: { id },
      select: {
        id: true,
        menuName: true,
        deletable: true,
        createdAt: true,
      },
    });
  }

  /**
   * Bulk delete using ids
   * @param ids
   * @returns { count: number }
   */
  async bulkDelete(ids: number[]) {
    const menusWithModules = await this.prisma.menu.findMany({
      where: {
        id: { in: ids },
        modules: { some: {} },
      },
      select: {
        id: true,
        menuName: true,
      },
    });

    if (menusWithModules.length > 0)
      throw new BadRequestException(
        `Cannot delete menus with existing modules: ${menusWithModules.map((m) => m.menuName).join(', ')}`,
      );

    return this.prisma.menu.deleteMany({
      where: { id: { in: ids }, deletable: true },
    });
  }
}
