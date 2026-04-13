import { Module } from '@nestjs/common';
import { PayrollsController } from './payrolls.controller';
import { PayrollsService } from './payrolls.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollsController],
  providers: [PayrollsService],
})
export class PayrollsModule {}
