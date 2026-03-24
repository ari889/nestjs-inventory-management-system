import { Injectable, NotFoundException } from '@nestjs/common';
import { Module } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { ModuleItemDto } from './dto/module-item.dto';

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
        parentId, // use the passed-in parentId, not item.parentId
      });

      if (item.children?.length) {
        result.push(...this.flattenItems(item.children, item.id));
      }
    }

    return result;
  }

  /**
   * Build tree
   * @param modules
   * @param parentId
   * @returns
   */
  private buildTree(
    modules: Module[],
    parentId: number | null = null,
  ): ModuleItemDto[] {
    return modules
      .filter((m) => m.parentId === parentId)
      .map((m) => ({
        id: m.id,
        menuId: m.menuId,
        type: m.type,
        moduleName: m.moduleName ?? undefined,
        dividerTitle: m.dividerTitle ?? undefined,
        iconClass: m.iconClass ?? undefined,
        url: m.url ?? undefined,
        order: m.order,
        parentId: m.parentId ?? undefined,
        target: m.target as '_self' | '_blank',
        deletable: m.deletable,
        children: this.buildTree(modules, m.id),
      }));
  }

  /**
   * Get modules by menu id
   * @param menuId
   * @returns Modules
   */
  async getModules(
    menuId: number,
  ): Promise<(Module & { children: (Module & { children: any[] })[] })[]> {
    const modules = await this.prisma.module.findMany({
      where: { menuId },
      orderBy: { order: 'asc' },
    });
    const map = new Map<number, Module & { children: any[] }>();
    modules.forEach((m) => map.set(m.id, { ...m, children: [] }));

    const roots: (Module & { children: any[] })[] = [];

    modules.forEach((m) => {
      const current = map.get(m.id)!;
      if (m.parentId) {
        const parent = map.get(m.parentId);
        if (parent) parent.children.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }

  /**
   * Get all modules with permissions
   * @returns
   */
  async getModulePermissions(): Promise<Module[]> {
    const modules = await this.prisma.module.findMany({
      where: {
        type: false,
      },
      orderBy: { order: 'asc' },
      include: {
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
    return modules;
  }

  /**
   * Get current logged in user modules
   * @param email
   * @returns Module
   */
  async getModuleByRole(
    email: string,
  ): Promise<(Module & { children: (Module & { children: any[] })[] })[]> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found!');

    const whereFilter =
      user.id !== 1 ? { moduleRole: { some: { roleId: user.role.id } } } : {};

    const modules = await this.prisma.module.findMany({
      where: whereFilter,
      orderBy: { order: 'asc' },
    });

    const map = new Map<number, Module & { children: any[] }>();
    modules.forEach((m) => map.set(m.id, { ...m, children: [] }));

    const roots: (Module & { children: any[] })[] = [];

    modules.forEach((m) => {
      const current = map.get(m.id)!;
      if (m.parentId) {
        const parent = map.get(m.parentId);
        if (parent) parent.children.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }

  /**
   * Create module
   * @param createModuleDto
   * @returns Module
   */
  async createModule(createModuleDto: CreateModuleDto): Promise<Module> {
    return this.prisma.module.create({
      data: {
        ...createModuleDto,
        target: createModuleDto?.target === '_self' ? 'SELF' : 'BLANK',
      },
    });
  }

  /**
   * Delete module by id
   * @param id
   * @returns Module
   */
  async deleteModule(id: number): Promise<Module> {
    return this.prisma.module.delete({ where: { id } });
  }

  /**
   * find module by id
   * @param id
   * @returns Module
   */
  async findModule(id: number): Promise<Module | null> {
    return this.prisma.module.findUnique({ where: { id } });
  }

  /**
   * Update module bu id
   * @param id
   * @param createModuleDto
   * @returns Module
   */
  async updateModule(id: number, createModuleDto: CreateModuleDto) {
    const current = await this.prisma.module.findUnique({ where: { id } });

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
    });
  }

  /**
   * Update module order and parent id from recorder
   * @param items
   */
  async reorderMenuItems(items: ModuleItemDto[]): Promise<ModuleItemDto[]> {
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

    const modules = await this.prisma.module.findMany({
      where: { menuId: items[0].menuId },
      orderBy: { order: 'asc' },
    });

    return this.buildTree(modules);
  }
}
