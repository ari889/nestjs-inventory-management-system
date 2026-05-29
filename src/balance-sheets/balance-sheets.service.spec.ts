import { Test, TestingModule } from '@nestjs/testing';
import { BalanceSheetsService } from './balance-sheets.service';

describe('BalanceSheetsService', () => {
  let service: BalanceSheetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BalanceSheetsService],
    }).compile();

    service = module.get<BalanceSheetsService>(BalanceSheetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
