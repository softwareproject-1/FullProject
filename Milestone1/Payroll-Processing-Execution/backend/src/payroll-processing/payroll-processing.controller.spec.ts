import { Test, TestingModule } from '@nestjs/testing';
import { PayrollProcessingController } from './payroll-processing.controller';

describe('PayrollProcessingController', () => {
  let controller: PayrollProcessingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollProcessingController],
    }).compile();

    controller = module.get<PayrollProcessingController>(PayrollProcessingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
