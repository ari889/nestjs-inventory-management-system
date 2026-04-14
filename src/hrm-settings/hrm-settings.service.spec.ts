import { Test, TestingModule } from '@nestjs/testing';
import { HrmSettingsService } from './hrm-settings.service';

describe('HrmSettingsService', () => {
  let service: HrmSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HrmSettingsService],
    }).compile();

    service = module.get<HrmSettingsService>(HrmSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
