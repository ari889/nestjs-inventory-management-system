import { Injectable, NotFoundException } from '@nestjs/common';
import { Module } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class ModulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

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
    const user = await this.userService.findOne(email);
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

  async updateModule(id: number, createModuleDto: CreateModuleDto) {
    return this.prisma.module.update({
      where: { id },
      data: {
        ...createModuleDto,
        target: createModuleDto?.target === '_self' ? 'SELF' : 'BLANK',
      },
    });
  }
}
