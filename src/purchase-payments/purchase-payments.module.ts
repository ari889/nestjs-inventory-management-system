import { Module } from '@nestjs/common';
import { PurchasePaymentsController } from './purchase-payments.controller';
import { PurchasePaymentsService } from './purchase-payments.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasePaymentsController],
  providers: [PurchasePaymentsService],
})
export class PurchasePaymentsModule {}
