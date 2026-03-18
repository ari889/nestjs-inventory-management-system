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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
