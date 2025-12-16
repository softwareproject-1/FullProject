import { Test, TestingModule } from '@nestjs/testing';
import { PayrollProcessingService } from './payroll-processing.service';

describe('PayrollProcessingService', () => {
  let service: PayrollProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollProcessingService],
    }).compile();

    service = module.get<PayrollProcessingService>(PayrollProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
