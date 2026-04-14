import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MenusModule } from './menus/menus.module';
import { ModulesModule } from './modules/modules.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { PermissionGuard } from './common/guards/permission.guard';
import { SettingsModule } from './settings/settings.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { CustomerGroupsModule } from './customer-groups/customer-groups.module';
import { BrandsModule } from './brands/brands.module';
import { TaxesModule } from './taxes/taxes.module';
import { UnitsModule } from './units/units.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { AccountsModule } from './accounts/accounts.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { PayrollsModule } from './payrolls/payrolls.module';
import { AttendancesModule } from './attendances/attendances.module';
import { HrmSettingsModule } from './hrm-settings/hrm-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV || 'development'}.env`,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        const isDev = configService.get<string>('NODE_ENV') === 'development';

        if (isDev) {
          return {
            throttlers: [
              {
                ttl: 0,
                limit: 0,
              },
            ],
          };
        }

        return {
          throttlers: [
            {
              ttl: Number(configService.get('THROTTLE_TTL') || 10),
              limit: Number(configService.get('THROTTLE_LIMIT') || 1),
            },
          ],
        };
      },
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
    MenusModule,
    ModulesModule,
    PermissionsModule,
    RolesModule,
    SettingsModule,
    WarehousesModule,
    CustomerGroupsModule,
    BrandsModule,
    TaxesModule,
    UnitsModule,
    SuppliersModule,
    CustomersModule,
    AccountsModule,
    ExpensesModule,
    ExpenseCategoriesModule,
    DepartmentsModule,
    EmployeesModule,
    PayrollsModule,
    AttendancesModule,
    HrmSettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
