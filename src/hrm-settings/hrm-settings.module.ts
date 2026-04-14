import { Module } from '@nestjs/common';
import { HrmSettingsController } from './hrm-settings.controller';
import { HrmSettingsService } from './hrm-settings.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HrmSettingsController],
  providers: [HrmSettingsService],
})
export class HrmSettingsModule {}
