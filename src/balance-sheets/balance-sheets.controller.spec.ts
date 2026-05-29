import { Test, TestingModule } from '@nestjs/testing';
import { BalanceSheetsController } from './balance-sheets.controller';

describe('BalanceSheetsController', () => {
  let controller: BalanceSheetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceSheetsController],
    }).compile();

    controller = module.get<BalanceSheetsController>(BalanceSheetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
