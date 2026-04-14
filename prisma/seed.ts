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
    id: 1,
    menuId: 1,
    type: false,
    moduleName: 'Dashboard',
    dividerTitle: null,
    iconClass: 'House',
    url: '/admin/dashboard',
    order: 1,
    parentId: null,
  },

  {
    id: 2,
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
    id: 3,
    menuId: 1,
    type: false,
    moduleName: 'Product',
    dividerTitle: null,
    iconClass: 'Package',
    url: null,
    order: 3,
    parentId: null,
  },
  {
    id: 4,
    menuId: 1,
    type: false,
    moduleName: 'List',
    dividerTitle: null,
    iconClass: 'Plus',
    url: '/admin/products/categories',
    order: 4,
    parentId: 3,
  },
  {
    id: 5,
    menuId: 1,
    type: false,
    moduleName: 'Manage Product',
    dividerTitle: null,
    iconClass: 'ShoppingCart',
    url: '/admin/products',
    order: 5,
    parentId: 3,
  },
  {
    id: 6,
    menuId: 1,
    type: false,
    moduleName: 'Print Barcode',
    dividerTitle: null,
    iconClass: 'Barcode',
    url: '/admin/products/print-barcode',
    order: 6,
    parentId: 3,
  },

  {
    id: 7,
    menuId: 1,
    type: false,
    moduleName: 'Stock',
    dividerTitle: null,
    iconClass: 'Package',
    url: '/admin/stocks',
    order: 7,
    parentId: null,
  },

  {
    id: 8,
    menuId: 1,
    type: false,
    moduleName: 'Purchase',
    dividerTitle: null,
    iconClass: 'ShoppingCart',
    url: null,
    order: 8,
    parentId: null,
  },
  {
    id: 9,
    menuId: 1,
    type: false,
    moduleName: 'Add Purchase',
    dividerTitle: null,
    iconClass: 'Plus',
    url: '/admin/purchases/add',
    order: 9,
    parentId: 8,
  },
  {
    id: 10,
    menuId: 1,
    type: false,
    moduleName: 'Manage Purchase',
    dividerTitle: null,
    iconClass: 'List',
    url: '/admin/purchases',
    order: 10,
    parentId: 8,
  },

  {
    id: 11,
    menuId: 1,
    type: false,
    moduleName: 'Sale',
    dividerTitle: null,
    iconClass: 'Banknote',
    url: null,
    order: 11,
    parentId: null,
  },
  {
    id: 12,
    menuId: 1,
    type: false,
    moduleName: 'Add Sale',
    dividerTitle: null,
    iconClass: 'Plus',
    url: '/admin/sales/add',
    order: 12,
    parentId: 11,
  },
  {
    id: 13,
    menuId: 1,
    type: false,
    moduleName: 'Manage Sale',
    dividerTitle: null,
    iconClass: 'List',
    url: '/admin/sales',
    order: 13,
    parentId: 11,
  },

  {
    id: 14,
    menuId: 1,
    type: false,
    moduleName: 'Customer',
    dividerTitle: null,
    iconClass: 'User',
    url: '/admin/customers',
    order: 14,
    parentId: null,
  },

  {
    id: 15,
    menuId: 1,
    type: false,
    moduleName: 'Expense',
    dividerTitle: null,
    iconClass: 'Banknote',
    url: null,
    order: 15,
    parentId: null,
  },
  {
    id: 16,
    menuId: 1,
    type: false,
    moduleName: 'Expense Category',
    dividerTitle: null,
    iconClass: 'List',
    url: '/admin/expenses/categories',
    order: 16,
    parentId: 15,
  },
  {
    id: 17,
    menuId: 1,
    type: false,
    moduleName: 'Manage Expense',
    dividerTitle: null,
    iconClass: 'CreditCard',
    url: '/admin/expenses',
    order: 17,
    parentId: 15,
  },

  {
    id: 18,
    menuId: 1,
    type: false,
    moduleName: 'Supplier',
    dividerTitle: null,
    iconClass: 'Truck',
    url: '/admin/suppliers',
    order: 18,
    parentId: null,
  },

  {
    id: 19,
    menuId: 1,
    type: false,
    moduleName: 'Accounting',
    dividerTitle: null,
    iconClass: 'DollarSign',
    url: null,
    order: 19,
    parentId: null,
  },
  {
    id: 20,
    menuId: 1,
    type: false,
    moduleName: 'Manage Account',
    dividerTitle: null,
    iconClass: 'Banknote',
    url: '/admin/accounts',
    order: 20,
    parentId: 19,
  },
  {
    id: 21,
    menuId: 1,
    type: false,
    moduleName: 'Balance Sheet',
    dividerTitle: null,
    iconClass: 'Receipt',
    url: '/admin/accounts/balance-sheets',
    order: 21,
    parentId: 19,
  },

  {
    id: 22,
    menuId: 1,
    type: false,
    moduleName: 'HRM',
    dividerTitle: null,
    iconClass: 'Shield',
    url: null,
    order: 22,
    parentId: null,
  },
  {
    id: 23,
    menuId: 1,
    type: false,
    moduleName: 'Department',
    dividerTitle: null,
    iconClass: 'Network',
    url: '/admin/hrm/departments',
    order: 23,
    parentId: 22,
  },
  {
    id: 24,
    menuId: 1,
    type: false,
    moduleName: 'Attendance',
    dividerTitle: null,
    iconClass: 'BriefcaseBusiness',
    url: '/admin/hrm/attendances',
    order: 24,
    parentId: 22,
  },
  {
    id: 25,
    menuId: 1,
    type: false,
    moduleName: 'Payroll',
    dividerTitle: null,
    iconClass: 'Banknote',
    url: '/admin/hrm/payrolls',
    order: 25,
    parentId: 22,
  },
  {
    id: 26,
    menuId: 1,
    type: false,
    moduleName: 'Employee',
    dividerTitle: null,
    iconClass: 'IdCardLanyard',
    url: '/admin/hrm/employees',
    order: 26,
    parentId: 22,
  },

  {
    id: 27,
    menuId: 1,
    type: false,
    moduleName: 'Report',
    dividerTitle: null,
    iconClass: 'NotebookPen',
    url: null,
    order: 27,
    parentId: null,
  },
  {
    id: 28,
    menuId: 1,
    type: false,
    moduleName: 'Summary Report',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/summary-report',
    order: 28,
    parentId: 27,
  },
  {
    id: 29,
    menuId: 1,
    type: false,
    moduleName: 'Product Report',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/product-report',
    order: 29,
    parentId: 27,
  },
  {
    id: 30,
    menuId: 1,
    type: false,
    moduleName: 'Daily Sale',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/daily-sales-report',
    order: 30,
    parentId: 27,
  },
  {
    id: 31,
    menuId: 1,
    type: false,
    moduleName: 'Monthly Sale',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/monthly-sales-report',
    order: 31,
    parentId: 27,
  },
  {
    id: 32,
    menuId: 1,
    type: false,
    moduleName: 'Daily Purchase',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/daily-purchase-report',
    order: 32,
    parentId: 27,
  },
  {
    id: 33,
    menuId: 1,
    type: false,
    moduleName: 'Monthly Purchase',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/monthly-purchase-report',
    order: 33,
    parentId: 27,
  },
  {
    id: 34,
    menuId: 1,
    type: false,
    moduleName: 'Customer Report',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/customer-report',
    order: 34,
    parentId: 27,
  },
  {
    id: 35,
    menuId: 1,
    type: false,
    moduleName: 'Supplier Report',
    dividerTitle: null,
    iconClass: 'CircleDot',
    url: '/admin/reports/supplier-report',
    order: 35,
    parentId: 27,
  },

  {
    id: 36,
    menuId: 1,
    type: true,
    moduleName: null,
    dividerTitle: 'Access Control',
    iconClass: null,
    url: null,
    order: 36,
    parentId: null,
  },
  {
    id: 37,
    menuId: 1,
    type: false,
    moduleName: 'Users',
    dividerTitle: null,
    iconClass: 'Users',
    url: '/admin/users',
    order: 37,
    parentId: null,
  },
  {
    id: 38,
    menuId: 1,
    type: false,
    moduleName: 'Roles',
    dividerTitle: null,
    iconClass: 'UserCheck',
    url: '/admin/roles',
    order: 38,
    parentId: null,
  },

  {
    id: 39,
    menuId: 1,
    type: true,
    moduleName: null,
    dividerTitle: 'System',
    iconClass: null,
    url: null,
    order: 39,
    parentId: null,
  },
  {
    id: 40,
    menuId: 1,
    type: false,
    moduleName: 'Settings',
    dividerTitle: null,
    iconClass: 'Settings',
    url: '/admin/settings',
    order: 40,
    parentId: null,
  },
  {
    id: 41,
    menuId: 1,
    type: false,
    moduleName: 'HRM Setting',
    dividerTitle: null,
    iconClass: 'Wrench',
    url: '/admin/hrm-settings',
    order: 41,
    parentId: null,
  },
  {
    id: 42,
    menuId: 1,
    type: false,
    moduleName: 'Menu',
    dividerTitle: null,
    iconClass: 'SquareMenu',
    url: '/admin/menus',
    order: 42,
    parentId: null,
  },
  {
    id: 43,
    menuId: 1,
    type: false,
    moduleName: 'Permission',
    dividerTitle: null,
    iconClass: 'LayoutList',
    url: '/admin/permissions',
    order: 43,
    parentId: null,
  },
  {
    id: 44,
    menuId: 1,
    type: false,
    moduleName: 'Customer Group',
    dividerTitle: null,
    iconClass: 'UsersRound',
    url: '/admin/customer-groups',
    order: 44,
    parentId: null,
  },
  {
    id: 45,
    menuId: 1,
    type: false,
    moduleName: 'Warehouse',
    dividerTitle: null,
    iconClass: 'Warehouse',
    url: '/admin/warehouses',
    order: 45,
    parentId: null,
  },
  {
    id: 46,
    menuId: 1,
    type: false,
    moduleName: 'Brand',
    dividerTitle: null,
    iconClass: 'Notebook',
    url: '/admin/brands',
    order: 46,
    parentId: null,
  },
  {
    id: 47,
    menuId: 1,
    type: false,
    moduleName: 'Tax',
    dividerTitle: null,
    iconClass: 'Percent',
    url: '/admin/taxes',
    order: 47,
    parentId: null,
  },
  {
    id: 48,
    menuId: 1,
    type: false,
    moduleName: 'Unit',
    dividerTitle: null,
    iconClass: 'Weight',
    url: '/admin/units',
    order: 48,
    parentId: null,
  },
];

const permissionsData = [
  { moduleId: 1, name: 'Dashboard Access', slug: 'dashboard-access' },

  // Product
  { moduleId: 3, name: 'Product Access', slug: 'product-access' },
  { moduleId: 3, name: 'Product Add', slug: 'product-add' },
  { moduleId: 3, name: 'Product Edit', slug: 'product-edit' },
  { moduleId: 3, name: 'Product Delete', slug: 'product-delete' },
  { moduleId: 3, name: 'Product Bulk Delete', slug: 'product-bulk-delete' },

  // Category
  { moduleId: 4, name: 'Category Access', slug: 'category-access' },
  { moduleId: 4, name: 'Category Add', slug: 'category-add' },
  { moduleId: 4, name: 'Category Edit', slug: 'category-edit' },
  { moduleId: 4, name: 'Category Delete', slug: 'category-delete' },
  { moduleId: 4, name: 'Category Bulk Delete', slug: 'category-bulk-delete' },

  // Manage Product
  { moduleId: 5, name: 'Manage Product Access', slug: 'manage-product-access' },
  { moduleId: 5, name: 'Manage Product Add', slug: 'manage-product-add' },
  { moduleId: 5, name: 'Manage Product Edit', slug: 'manage-product-edit' },
  { moduleId: 5, name: 'Manage Product Delete', slug: 'manage-product-delete' },
  {
    moduleId: 5,
    name: 'Manage Product Bulk Delete',
    slug: 'manage-product-bulk-delete',
  },

  // Barcode
  { moduleId: 6, name: 'Print Barcode Access', slug: 'print-barcode-access' },

  // Stock
  { moduleId: 7, name: 'Stock Access', slug: 'stock-access' },
  { moduleId: 7, name: 'Stock Add', slug: 'stock-add' },
  { moduleId: 7, name: 'Stock Edit', slug: 'stock-edit' },
  { moduleId: 7, name: 'Stock Delete', slug: 'stock-delete' },
  { moduleId: 7, name: 'Stock Bulk Delete', slug: 'stock-bulk-delete' },

  // Purchase
  { moduleId: 8, name: 'Purchase Access', slug: 'purchase-access' },
  { moduleId: 8, name: 'Purchase Add', slug: 'purchase-add' },
  { moduleId: 8, name: 'Purchase Edit', slug: 'purchase-edit' },
  { moduleId: 8, name: 'Purchase Delete', slug: 'purchase-delete' },
  { moduleId: 8, name: 'Purchase Bulk Delete', slug: 'purchase-bulk-delete' },

  // Sale
  { moduleId: 11, name: 'Sale Access', slug: 'sale-access' },
  { moduleId: 11, name: 'Sale Add', slug: 'sale-add' },
  { moduleId: 11, name: 'Sale Edit', slug: 'sale-edit' },
  { moduleId: 11, name: 'Sale Delete', slug: 'sale-delete' },
  { moduleId: 11, name: 'Sale Bulk Delete', slug: 'sale-bulk-delete' },

  // Customer
  { moduleId: 14, name: 'Customer Access', slug: 'customer-access' },
  { moduleId: 14, name: 'Customer Add', slug: 'customer-add' },
  { moduleId: 14, name: 'Customer Edit', slug: 'customer-edit' },
  { moduleId: 14, name: 'Customer Delete', slug: 'customer-delete' },
  { moduleId: 14, name: 'Customer Bulk Delete', slug: 'customer-bulk-delete' },

  // Expense
  { moduleId: 15, name: 'Expense Access', slug: 'expense-access' },
  { moduleId: 15, name: 'Expense Add', slug: 'expense-add' },
  { moduleId: 15, name: 'Expense Edit', slug: 'expense-edit' },
  { moduleId: 15, name: 'Expense Delete', slug: 'expense-delete' },
  { moduleId: 15, name: 'Expense Bulk Delete', slug: 'expense-bulk-delete' },

  {
    moduleId: 16,
    name: 'Expense Category Access',
    slug: 'expense-category-access',
  },
  { moduleId: 16, name: 'Expense Category Add', slug: 'expense-category-add' },
  {
    moduleId: 16,
    name: 'Expense Category Edit',
    slug: 'expense-category-edit',
  },
  {
    moduleId: 16,
    name: 'Expense Category Delete',
    slug: 'expense-category-delete',
  },
  {
    moduleId: 16,
    name: 'Expense Category Bulk Delete',
    slug: 'expense-category-bulk-delete',
  },

  {
    moduleId: 17,
    name: 'Manage Expense Access',
    slug: 'manage-expense-access',
  },

  // Supplier
  { moduleId: 18, name: 'Supplier Access', slug: 'supplier-access' },
  { moduleId: 18, name: 'Supplier Add', slug: 'supplier-add' },
  { moduleId: 18, name: 'Supplier Edit', slug: 'supplier-edit' },
  { moduleId: 18, name: 'Supplier Delete', slug: 'supplier-delete' },
  { moduleId: 18, name: 'Supplier Bulk Delete', slug: 'supplier-bulk-delete' },

  // Accounting
  { moduleId: 20, name: 'Account Access', slug: 'account-access' },
  { moduleId: 20, name: 'Account Add', slug: 'account-add' },
  { moduleId: 20, name: 'Account Edit', slug: 'account-edit' },
  { moduleId: 20, name: 'Account Delete', slug: 'account-delete' },
  {
    moduleId: 20,
    name: 'Account Bulk Delete',
    slug: 'account-bulk-delete',
  },
  { moduleId: 21, name: 'Balance Sheet Access', slug: 'balance-sheet-access' },

  { moduleId: 23, name: 'Department Access', slug: 'department-access' },
  { moduleId: 23, name: 'Department View', slug: 'department-view' },
  { moduleId: 23, name: 'Department Add', slug: 'department-add' },
  { moduleId: 23, name: 'Department Edit', slug: 'department-edit' },
  { moduleId: 23, name: 'Department Delete', slug: 'department-delete' },
  {
    moduleId: 23,
    name: 'Department Bulk Delete',
    slug: 'department-bulk-delete',
  },
  { moduleId: 24, name: 'Attendance Access', slug: 'attendance-access' },
  { moduleId: 24, name: 'Attendance view', slug: 'attendance-view' },
  { moduleId: 24, name: 'Attendance Add', slug: 'attendance-add' },
  { moduleId: 24, name: 'Attendance Edit', slug: 'attendance-edit' },
  { moduleId: 24, name: 'Attendance Delete', slug: 'attendance-delete' },
  {
    moduleId: 24,
    name: 'Attendance bulk Delete',
    slug: 'attendance-bulk-delete',
  },
  { moduleId: 25, name: 'Payroll Access', slug: 'payroll-access' },
  { moduleId: 25, name: 'Payroll View', slug: 'payroll-view' },
  { moduleId: 25, name: 'Payroll Add', slug: 'payroll-add' },
  { moduleId: 25, name: 'Payroll Edit', slug: 'payroll-edit' },
  { moduleId: 25, name: 'Payroll Delete', slug: 'payroll-delete' },
  { moduleId: 25, name: 'Payroll Bulk Delete', slug: 'payroll-bulk-delete' },

  // ✅ Employee (NEW)
  { moduleId: 26, name: 'Employee Access', slug: 'employee-access' },
  { moduleId: 26, name: 'Employee Add', slug: 'employee-add' },
  { moduleId: 26, name: 'Employee Edit', slug: 'employee-edit' },
  { moduleId: 26, name: 'Employee Delete', slug: 'employee-delete' },
  { moduleId: 26, name: 'Employee Bulk Delete', slug: 'employee-bulk-delete' },

  {
    moduleId: 28,
    name: 'Summary Report Access',
    slug: 'summary-report-access',
  },
  {
    moduleId: 29,
    name: 'Product Report Access',
    slug: 'product-report-access',
  },
  { moduleId: 30, name: 'Daily Sale Access', slug: 'daily-sale-access' },
  { moduleId: 31, name: 'Monthly Sale Access', slug: 'monthly-sale-access' },
  {
    moduleId: 32,
    name: 'Daily Purchase Access',
    slug: 'daily-purchase-access',
  },
  {
    moduleId: 33,
    name: 'Monthly Purchase Access',
    slug: 'monthly-purchase-access',
  },
  {
    moduleId: 34,
    name: 'Customer Report Access',
    slug: 'customer-report-access',
  },
  {
    moduleId: 35,
    name: 'Supplier Report Access',
    slug: 'supplier-report-access',
  },

  // Users
  { moduleId: 37, name: 'Users Access', slug: 'users-access' },
  { moduleId: 37, name: 'Users Add', slug: 'users-add' },
  { moduleId: 37, name: 'Users Edit', slug: 'users-edit' },
  { moduleId: 37, name: 'Users Delete', slug: 'users-delete' },
  { moduleId: 37, name: 'Users Bulk Delete', slug: 'users-bulk-delete' },

  // Roles
  { moduleId: 38, name: 'Roles Access', slug: 'roles-access' },
  { moduleId: 38, name: 'Roles Add', slug: 'roles-add' },
  { moduleId: 38, name: 'Roles Edit', slug: 'roles-edit' },
  { moduleId: 38, name: 'Roles Delete', slug: 'roles-delete' },
  { moduleId: 38, name: 'Roles Bulk Delete', slug: 'roles-bulk-delete' },

  // System
  { moduleId: 40, name: 'Settings Access', slug: 'settings-access' },
  { moduleId: 40, name: 'Settings Add', slug: 'settings-add' },
  { moduleId: 40, name: 'Settings Edit', slug: 'settings-edit' },
  { moduleId: 40, name: 'Settings Delete', slug: 'settings-delete' },
  { moduleId: 40, name: 'Settings Bulk Delete', slug: 'settings-bulk-delete' },

  { moduleId: 41, name: 'HRM Setting Access', slug: 'hrm-setting-access' },
  { moduleId: 41, name: 'HRM Setting Add', slug: 'hrm-setting-add' },
  { moduleId: 41, name: 'HRM Setting Edit', slug: 'hrm-setting-edit' },
  { moduleId: 41, name: 'HRM Setting Delete', slug: 'hrm-setting-delete' },
  {
    moduleId: 41,
    name: 'HRM Setting Bulk Delete',
    slug: 'hrm-setting-bulk-delete',
  },

  { moduleId: 42, name: 'Menu Access', slug: 'menu-access' },
  { moduleId: 42, name: 'Menu Add', slug: 'menu-add' },
  { moduleId: 42, name: 'Menu Edit', slug: 'menu-edit' },
  { moduleId: 42, name: 'Menu Delete', slug: 'menu-delete' },
  { moduleId: 42, name: 'Menu Bulk Delete', slug: 'menu-bulk-delete' },

  { moduleId: 43, name: 'Permission Access', slug: 'permission-access' },
  { moduleId: 43, name: 'Permission Add', slug: 'permission-add' },
  { moduleId: 43, name: 'Permission Edit', slug: 'permission-edit' },
  { moduleId: 43, name: 'Permission Delete', slug: 'permission-delete' },
  {
    moduleId: 43,
    name: 'Permission Bulk Delete',
    slug: 'permission-bulk-delete',
  },

  {
    moduleId: 44,
    name: 'Customer Group Access',
    slug: 'customer-group-access',
  },
  { moduleId: 44, name: 'Customer Group Add', slug: 'customer-group-add' },
  { moduleId: 44, name: 'Customer Group Edit', slug: 'customer-group-edit' },
  {
    moduleId: 44,
    name: 'Customer Group Delete',
    slug: 'customer-group-delete',
  },
  {
    moduleId: 44,
    name: 'Customer Group Bulk Delete',
    slug: 'customer-group-bulk-delete',
  },

  { moduleId: 45, name: 'Warehouse Access', slug: 'warehouse-access' },
  { moduleId: 45, name: 'Warehouse Add', slug: 'warehouse-add' },
  { moduleId: 45, name: 'Warehouse Edit', slug: 'warehouse-edit' },
  { moduleId: 45, name: 'Warehouse Delete', slug: 'warehouse-delete' },
  {
    moduleId: 45,
    name: 'Warehouse Bulk Delete',
    slug: 'warehouse-bulk-delete',
  },

  { moduleId: 46, name: 'Brand Access', slug: 'brand-access' },
  { moduleId: 46, name: 'Brand Add', slug: 'brand-add' },
  { moduleId: 46, name: 'Brand Edit', slug: 'brand-edit' },
  { moduleId: 46, name: 'Brand Delete', slug: 'brand-delete' },
  { moduleId: 46, name: 'Brand Bulk Delete', slug: 'brand-bulk-delete' },

  { moduleId: 47, name: 'Tax Access', slug: 'tax-access' },
  { moduleId: 47, name: 'Tax Add', slug: 'tax-add' },
  { moduleId: 47, name: 'Tax Edit', slug: 'tax-edit' },
  { moduleId: 47, name: 'Tax Delete', slug: 'tax-delete' },
  { moduleId: 47, name: 'Tax Bulk Delete', slug: 'tax-bulk-delete' },

  { moduleId: 48, name: 'Unit Access', slug: 'unit-access' },
  { moduleId: 48, name: 'Unit Add', slug: 'unit-add' },
  { moduleId: 48, name: 'Unit Edit', slug: 'unit-edit' },
  { moduleId: 48, name: 'Unit Delete', slug: 'unit-delete' },
  { moduleId: 48, name: 'Unit Bulk Delete', slug: 'unit-bulk-delete' },
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
  for (const module of modulesData) {
    await prisma.module.upsert({
      where: { id: module.id },
      update: module,
      create: module,
    });
  }
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
