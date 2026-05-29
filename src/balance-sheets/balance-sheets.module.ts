import { Module } from '@nestjs/common';
import { BalanceSheetsController } from './balance-sheets.controller';
import { BalanceSheetsService } from './balance-sheets.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BalanceSheetsController],
  providers: [BalanceSheetsService],
})
export class BalanceSheetsModule {}
