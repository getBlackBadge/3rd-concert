import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from '../queue.controller';
import { QueueService } from '../../../application/services/queue.service';
import { CreateTokenDto } from '../../dto/create-token.dto';
import { QueueStatusRequestDto, QueueStatusResDto } from '../../dto/queue-status.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('QueueController', () => {
  let controller: QueueController;
  let queueService: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: {
            createToken: jest.fn(),
            getQueueStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    queueService = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createToken', () => {
    it('should create a token successfully', async () => {
      const createTokenDto: CreateTokenDto = { userId: '123', concertId: '456' };
      const expectedToken = 'generatedToken123';
      
      jest.spyOn(queueService, 'createToken').mockResolvedValue(expectedToken);

      const result = await controller.createToken(createTokenDto);

      expect(result).toEqual({ token: expectedToken });
      expect(queueService.createToken).toHaveBeenCalledWith(createTokenDto);
    });

    it('should throw HttpException when token creation fails', async () => {
      const createTokenDto: CreateTokenDto = { userId: '123', concertId: '456' };
      
      jest.spyOn(queueService, 'createToken').mockRejectedValue(new Error('Token creation failed'));

      await expect(controller.createToken(createTokenDto)).rejects.toThrow(
        new HttpException('토큰 생성에 실패했습니다.', HttpStatus.BAD_REQUEST)
      );
    });

    it('should process requests with the same concertId sequentially', async () => {
      const concertId = '789';
      const createTokenDtos: CreateTokenDto[] = [
        { userId: '1', concertId },
        { userId: '2', concertId },
        { userId: '3', concertId },
      ];

      const expectedTokens = ['token1', 'token2', 'token3'];
      let callCount = 0;

      jest.spyOn(queueService, 'createToken').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10)); // 약간의 지연 추가
        return expectedTokens[callCount++];
      });

      const results = await Promise.all(createTokenDtos.map(dto => controller.createToken(dto)));

      expect(results).toEqual(expectedTokens.map(token => ({ token })));
      expect(queueService.createToken).toHaveBeenCalledTimes(3);
      createTokenDtos.forEach((dto, index) => {
        expect(queueService.createToken).toHaveBeenNthCalledWith(index + 1, dto);
      });
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status successfully', async () => {
      const queueStatusRequestDto: QueueStatusRequestDto = { token: 'testToken' };
      const expectedStatus: QueueStatusResDto = {
        token: 'testToken',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        concertId: '123e4567-e89b-12d3-a456-426614174001',
        position: 42,
        queueLength: 1000
      };
      
      jest.spyOn(queueService, 'getQueueStatus').mockResolvedValue(expectedStatus);

      const result = await controller.getQueueStatus(queueStatusRequestDto);

      expect(result).toEqual(expectedStatus);
      expect(queueService.getQueueStatus).toHaveBeenCalledWith(queueStatusRequestDto);
    });

    it('should throw HttpException when status retrieval fails', async () => {
      const queueStatusRequestDto: QueueStatusRequestDto = { token: 'testToken' };
      
      jest.spyOn(queueService, 'getQueueStatus').mockRejectedValue(new Error('Status retrieval failed'));

      await expect(controller.getQueueStatus(queueStatusRequestDto)).rejects.toThrow(
        new HttpException('대기열 상태 조회에 실패했습니다.', HttpStatus.BAD_REQUEST)
      );
    });
  });
});