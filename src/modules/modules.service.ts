import { Injectable, NotFoundException } from '@nestjs/common';
import { Module } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ModulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async getModules() {
    return this.prisma.module.findMany();
  }

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
}
