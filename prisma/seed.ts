import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import { hashPassword } from 'src/common/hash';
import { PrismaClient } from 'src/generated/prisma/client';
config({ path: '.development.env' });

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  }),
});

const roles = [
  {
    id: 1,
    roleName: 'Super Admin',
    deletable: false,
  },
  {
    id: 2,
    roleName: 'Admin',
    deletable: false,
  },
];

const user = {
  name: 'Super Admin',
  email: 'admin@gmail.com',
  phoneNo: '1234567890',
  password: 'asdfg1234',
  roleId: 1,
  createdBy: 1,
  updatedBy: 1,
};

const settingsData = [
  {
    name: 'title',
    value: 'Inventory Management System',
  },
  {
    name: 'address',
    value: 'Dhaka, Bangladesh',
  },
  {
    name: 'logo',
    value: '',
  },
  {
    name: 'favicon',
    value: '',
  },
  {
    name: 'currency_code',
    value: 'BDT',
  },
  {
    name: 'currency_symbol',
    value: 'TK',
  },
  {
    name: 'currency_position',
    value: 'suffix',
  },
  {
    name: 'invoice_suffix',
    value: 'INV-',
  },
  {
    name: 'invoice_number',
    value: '00001',
  },
  {
    name: 'timezone',
    value: 'Asia/Dhaka',
  },
  {
    name: 'date_format',
    value: 'd-m-y',
  },
  {
    name: 'mail_mailer',
    value: 'smtp',
  },
  {
    name: 'mail_host',
    value: '',
  },
  {
    name: 'mail_port',
    value: '',
  },
  {
    name: 'mail_username',
    value: 'username',
  },
  {
    name: 'mail_password',
    value: '',
  },
  {
    name: 'mail_encryption',
    value: '',
  },
  {
    name: 'mail_from_name',
    value: '',
  },
];

const menu = {
  menuName: 'Backend Menu',
  deletable: false,
};

const modulesData = [
  {
    menuId: 1,
    type: false,
    moduleName: 'Dashboard',
    dividerTitle: null,
    iconClass: 'fas fa-tachometer-alt',
    url: '/',
    order: 1,
    parentId: null,
  },
  {
    menuId: 1,
    type: true,
    moduleName: null,
    dividerTitle: 'Menus',
    iconClass: null,
    url: null,
    order: 2,
    parentId: null,
  },
  {
    menuId: 1,
    type: true,
    moduleName: null,
    dividerTitle: 'Access Control',
    iconClass: null,
    url: null,
    order: 3,
    parentId: null,
  },
  {
    menuId: 1,
    type: true,
    moduleName: 'User',
    dividerTitle: null,
    iconClass: 'fas fa-users',
    url: 'user',
    order: 4,
    parentId: null,
  },
  {
    menuId: 1,
    type: false,
    moduleName: 'Role',
    dividerTitle: null,
    iconClass: 'fas fa-user-tag',
    url: 'role',
    order: 5,
    parentId: null,
  },
  {
    menuId: 1,
    type: true,
    moduleName: null,
    dividerTitle: 'System',
    iconClass: null,
    url: null,
    order: 6,
    parentId: null,
  },
  {
    menuId: 1,
    type: false,
    moduleName: 'Menu',
    dividerTitle: null,
    iconClass: 'fas fa-th-list',
    url: 'menu',
    order: 7,
    parentId: null,
  },
  {
    menuId: 1,
    type: false,
    moduleName: 'Setting',
    dividerTitle: null,
    iconClass: 'fas fa-cogs',
    url: 'setting',
    order: 8,
    parentId: null,
  },
  {
    menuId: 1,
    type: false,
    moduleName: 'Permission',
    dividerTitle: null,
    iconClass: 'fas fa-tasks',
    url: 'menu/module/permission',
    order: 9,
    parentId: null,
  },
];

const permissionsData = [
  { moduleId: 9, name: 'Permission Access', slug: 'permission-access' },
  { moduleId: 9, name: 'Permission Add', slug: 'permission-add' },
  { moduleId: 9, name: 'Permission Edit', slug: 'permission-edit' },
  { moduleId: 9, name: 'Permission Delete', slug: 'permission-delete' },
  {
    moduleId: 9,
    name: 'Permission Bulk Delete',
    slug: 'permission-bulk-delete',
  },
  { moduleId: 9, name: 'Permission Report', slug: 'permission-report' },
  { moduleId: 7, name: 'Menu Access', slug: 'menu-access' },
  { moduleId: 7, name: 'Menu Add', slug: 'menu-add' },
  { moduleId: 7, name: 'Menu Edit', slug: 'menu-edit' },
  { moduleId: 7, name: 'Menu Delete', slug: 'menu-delete' },
  { moduleId: 7, name: 'Menu Bulk Delete', slug: 'menu-bulk-delete' },
  { moduleId: 7, name: 'Menu Report', slug: 'menu-report' },
];

async function main() {
  console.log('🌱 Seeding Roles...');

  await Promise.all(
    roles.map(
      async (role) =>
        await prisma.role.upsert({
          where: { id: role.id },
          update: role,
          create: role,
        }),
    ),
  );
  console.log('✅ Roles seeded successfully!');

  console.log('🌱 Seeding Users...');

  const hashedPassword = await hashPassword(user.password);
  await prisma.user.upsert({
    where: { id: 1 },
    update: { ...user, password: hashedPassword },
    create: { ...user, password: hashedPassword },
  });

  console.log('✅ Users seeded successfully!');

  console.log('🌱 Seeding Settings...');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await prisma.setting.createMany({
    data: settingsData,
    skipDuplicates: true,
  });
  console.log('✅ Settings seeded successfully!');

  console.log('🌱 Seeding Menu...');
  await prisma.menu.upsert({
    where: { id: 1 },
    update: menu,
    create: menu,
  });
  console.log('✅ Menu seeded successfully!');

  console.log('🌱 Seeding Modules...');
  await Promise.all(
    modulesData.map(
      async (module, index) =>
        await prisma.module.upsert({
          where: { id: index + 1 },
          update: module,
          create: module,
        }),
    ),
  );
  console.log('✅ Modules seeded successfully!');

  console.log('🌱 Seeding Permissions...');
  await Promise.all(
    permissionsData.map(
      async (permission, index) =>
        await prisma.permission.upsert({
          where: { id: index + 1 },
          update: permission,
          create: permission,
        }),
    ),
  );
  console.log('✅ Permissions seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
