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
        console.log(
          'THROTTLE_TTL at startup:',
          configService.get('THROTTLE_TTL'),
        );
        console.log(
          'THROTTLE_LIMIT at startup:',
          configService.get('THROTTLE_LIMIT'),
        );

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
