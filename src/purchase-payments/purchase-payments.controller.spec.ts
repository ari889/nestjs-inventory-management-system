import { Test, TestingModule } from '@nestjs/testing';
import { PurchasePaymentsController } from './purchase-payments.controller';

describe('PurchasePaymentsController', () => {
  let controller: PurchasePaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasePaymentsController],
    }).compile();

    controller = module.get<PurchasePaymentsController>(PurchasePaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
