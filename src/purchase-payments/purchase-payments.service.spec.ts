import { Test, TestingModule } from '@nestjs/testing';
import { PurchasePaymentsService } from './purchase-payments.service';

describe('PurchasePaymentsService', () => {
  let service: PurchasePaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchasePaymentsService],
    }).compile();

    service = module.get<PurchasePaymentsService>(PurchasePaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
