import { Test, TestingModule } from '@nestjs/testing';
import { XpertService } from './xpert.service';

describe('XpertService', () => {
  let service: XpertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XpertService],
    }).compile();

    service = module.get<XpertService>(XpertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
