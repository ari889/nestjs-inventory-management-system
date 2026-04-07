import { Test, TestingModule } from '@nestjs/testing';
import { CustomerGroupsService } from './customer-groups.service';

describe('CustomerGroupsService', () => {
  let service: CustomerGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerGroupsService],
    }).compile();

    service = module.get<CustomerGroupsService>(CustomerGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
