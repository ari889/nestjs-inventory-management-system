import { Module } from 'src/generated/prisma/client';

export interface ModuleChildrenType extends Omit<
  Module,
  'createdAt' | 'updatedAt'
> {
  children: Array<Omit<Module, 'createdAt' | 'updatedAt'>>;
}
