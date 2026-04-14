import { Test, TestingModule } from '@nestjs/testing';
import { HrmSettingsController } from './hrm-settings.controller';

describe('HrmSettingsController', () => {
  let controller: HrmSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrmSettingsController],
    }).compile();

    controller = module.get<HrmSettingsController>(HrmSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
