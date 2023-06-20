import { Test, TestingModule } from '@nestjs/testing';
import { XpertController } from './xpert.controller';

describe('XpertController', () => {
  let controller: XpertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XpertController],
    }).compile();

    controller = module.get<XpertController>(XpertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
