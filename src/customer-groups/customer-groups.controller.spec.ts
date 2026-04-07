import { Test, TestingModule } from '@nestjs/testing';
import { CustomerGroupsController } from './customer-groups.controller';

describe('CustomerGroupsController', () => {
  let controller: CustomerGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerGroupsController],
    }).compile();

    controller = module.get<CustomerGroupsController>(CustomerGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
