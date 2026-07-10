import { Injectable, NotFoundException } from '@nestjs/common';
import { Module } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { ModuleChildrenType } from './@types/module.types';
import { ModuleItemDto } from './dto/module-item.dto';
import { ModuleQueryDto } from './schemas/module-query.schema';

@Injectable()
export class ModulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  /**
   * Flatten items
   * @param items
   * @param parentId
   * @returns
   */
  private flattenItems(
    items: ModuleItemDto[],
    parentId: number | null = null,
  ): { id: number; order: number; parentId: number | null }[] {
    const result: { id: number; order: number; parentId: number | null }[] = [];

    for (const item of items) {
      result.push({
        id: item.id,
        order: item.order,
        parentId,
      });

      if (item.children?.length) {
        result.push(...this.flattenItems(item.children, item.id));
      }
    }

    return result;
  }

  /**
   * Get modules
   * @returns modules
   */
  async findAll({
    page = 0,
    limit = 10,
    order = 'createdAt',
    direction = 'desc',
    search = '',
    type = undefined,
  }: ModuleQueryDto): Promise<{
    items: Omit<Module, 'menuId' | 'updatedAt'>[];
    totalItems: number;
  }> {
    const where = {
      ...(search && {
        OR: [
          { moduleName: { contains: search } },
          { dividerTitle: { contains: search } },
        ],
      }),
      ...(type !== undefined && { type }),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.module.findMany({
        where,
        skip: page * limit,
        take: limit,
        orderBy: {
          [order]: direction,
        },
        select: {
          id: true,
          menu: {
            select: {
              id: true,
              menuName: true,
            },
          },
          type: true,
          moduleName: true,
          dividerTitle: true,
          iconClass: true,
          url: true,
          order: true,
          parentId: true,
          target: true,
          deletable: true,
          createdAt: true,
        },
      }),
      this.prisma.module.count({ where }),
    ]);
    return {
      items,
      totalItems,
    };
  }

  /**
   * Get modules by menu id
   * @param menuId
   * @returns Modules
   */
  async getModules(menuId: number): Promise<ModuleChildrenType[]> {
    return this.prisma.module.findMany({
      where: {
        menuId,
        parentId: null,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
        children: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get all modules with permissions
   * @returns
   */
  async getModulePermissions(): Promise<
    Array<Omit<Module, 'createdAt' | 'updatedAt'>>
  > {
    return this.prisma.module.findMany({
      where: {
        type: false,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
        permissions: {
          select: {
            id: true,
            name: true,
            slug: true,
            deletable: true,
          },
        },
      },
    });
  }

  /**
   * Get current logged in user modules
   * @param email
   * @returns Module
   */
  async getModuleByRole(email: string): Promise<ModuleChildrenType[]> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found!');

    const isSuperAdmin = user.role?.id === 1;

    return this.prisma.module.findMany({
      where: {
        parentId: null,
        ...(!isSuperAdmin && {
          moduleRole: { some: { roleId: user.role?.id } },
        }),
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
        children: {
          where: !isSuperAdmin
            ? { moduleRole: { some: { roleId: user.role?.id } } }
            : {},
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Create module
   * @param createModuleDto
   * @returns Module
   */
  async createModule(
    createModuleDto: CreateModuleDto,
  ): Promise<Omit<Module, 'createdAt' | 'updatedAt'>> {
    return this.prisma.module.create({
      data: {
        ...createModuleDto,
        target: createModuleDto?.target === '_self' ? 'SELF' : 'BLANK',
      },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
      },
    });
  }

  /**
   * Delete module by id
   * @param id
   * @returns Module
   */
  async deleteModule(id: number): Promise<Pick<Module, 'id' | 'moduleName'>> {
    return this.prisma.module.delete({
      where: { id },
      select: { id: true, moduleName: true },
    });
  }

  /**
   * find module by id
   * @param id
   * @returns Module
   */
  async findModule(
    id: number,
  ): Promise<Omit<Module, 'createdAt' | 'updatedAt'> | null> {
    return this.prisma.module.findUnique({
      where: { id },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
      },
    });
  }

  /**
   * Update module bu id
   * @param id
   * @param createModuleDto
   * @returns Module
   */
  async updateModule(id: number, createModuleDto: CreateModuleDto) {
    const current = await this.prisma.module.findUnique({ where: { id } });

    if (!current) throw new NotFoundException('Module not found!');

    return this.prisma.module.update({
      where: { id },
      data: {
        ...createModuleDto,
        target: createModuleDto?.target === '_self' ? 'SELF' : 'BLANK',
        ...(!createModuleDto.type &&
          current?.type && {
            dividerTitle: null,
          }),
        ...(createModuleDto.type &&
          !current?.type && {
            moduleName: null,
            iconClass: null,
            url: null,
          }),
      },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
      },
    });
  }

  /**
   * Update module order and parent id from recorder
   * @param items
   */
  async reorderMenuItems(
    items: ModuleItemDto[],
  ): Promise<ModuleChildrenType[]> {
    const flatItems = this.flattenItems(items);

    await this.prisma.$transaction(
      flatItems.map((item) =>
        this.prisma.module.update({
          where: { id: item.id },
          data: {
            order: item.order,
            parentId: item.parentId,
          },
        }),
      ),
    );

    return this.prisma.module.findMany({
      where: {
        menuId: items[0].menuId,
        parentId: null,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        menuId: true,
        type: true,
        moduleName: true,
        dividerTitle: true,
        iconClass: true,
        url: true,
        order: true,
        parentId: true,
        target: true,
        deletable: true,
        children: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }
}
