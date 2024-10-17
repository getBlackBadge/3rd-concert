import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QueueService } from '../queue.service';
import { Queue } from '../../../domain/entities/queue.entity';
import { Concert } from '../../../domain/entities/concert.entity';
import { JwtService } from '../../../common/jwt/jwt.service';
import { CreateTokenDto } from '../../../api/dto/create-token.dto';
import { QueueStatusRequestDto } from '../../../api/dto/queue-status.dto';

// QueueService에 대한 테스트 스위트
describe('QueueService', () => {
  let service: QueueService;
  let queueRepository: Repository<Queue>;
  let concertRepository: Repository<Concert>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  // 각 테스트 전에 실행되는 설정
  beforeEach(async () => {
    // 테스트 모듈 생성 및 의존성 주입
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getRepositoryToken(Queue),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Concert),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            generateToken: jest.fn(),
            verifyToken: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    // 필요한 서비스와 리포지토리 가져오기
    service = module.get<QueueService>(QueueService);
    queueRepository = module.get<Repository<Queue>>(getRepositoryToken(Queue));
    concertRepository = module.get<Repository<Concert>>(getRepositoryToken(Concert));
    jwtService = module.get<JwtService>(JwtService);
    dataSource = module.get<DataSource>(DataSource);
  });

  // QueueService가 정의되었는지 확인하는 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // createToken 메서드에 대한 테스트 스위트
  describe('createToken', () => {
    // 토큰 생성 성공 케이스 테스트
    it('should create a token successfully', async () => {
      const createTokenDto: CreateTokenDto = {
        userId: '1',
        concertId: '1',
      };

      // 모의 데이터 설정
      const mockConcert = { id: '1', queue_count: 0 };
      const mockQueueEntry = { user: { id: '1' }, concert: { id: '1' }, queue_position: 1 };
      const mockToken = 'mock-token';

      // 리포지토리와 서비스의 메서드 모의 구현
      jest.spyOn(concertRepository, 'findOne').mockResolvedValue(mockConcert as Concert);
      jest.spyOn(queueRepository, 'create').mockReturnValue(mockQueueEntry as Queue);
      jest.spyOn(jwtService, 'generateToken').mockReturnValue(mockToken);

      // 트랜잭션 모의 구현
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          query: jest.fn(),
          save: jest.fn().mockResolvedValue(mockQueueEntry),
          update: jest.fn(),
        });
      });

      // 메서드 실행 및 결과 검증
      const result = await service.createToken(createTokenDto);

      expect(result).toBe(mockToken);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(jwtService.generateToken).toHaveBeenCalledWith({
        userId: '1',
        concertId: '1',
        queuePosition: 1,
      });
    });
  });

  // getQueueStatus 메서드에 대한 테스트 스위트
  describe('getQueueStatus', () => {
    // 대기열 상태 조회 성공 케이스 테스트
    it('should return queue status successfully', async () => {
      const getQueueStatusDto: QueueStatusRequestDto = {
        token: 'mock-token',
      };

      // 모의 데이터 설정
      const mockDecodedToken = {
        userId: '1',
        concertId: '1',
        queuePosition: 5,
      };

      const mockQueueEntry = {
        user: { id: '1' },
        concert: { id: '1' },
        queue_position: 5,
      };

      // 서비스와 리포지토리 메서드 모의 구현
      jest.spyOn(jwtService, 'verifyToken').mockReturnValue(mockDecodedToken);
      jest.spyOn(queueRepository, 'findOne').mockResolvedValue(mockQueueEntry as Queue);
      jest.spyOn(queueRepository, 'count').mockResolvedValue(10);

      // 메서드 실행 및 결과 검증
      const result = await service.getQueueStatus(getQueueStatusDto);

      expect(result).toEqual({
        userId: '1',
        concertId: '1',
        token: 'mock-token',
        position: 5,
        queueLength: 10,
      });
      expect(jwtService.verifyToken).toHaveBeenCalledWith('mock-token');
      expect(queueRepository.findOne).toHaveBeenCalled();
      expect(queueRepository.count).toHaveBeenCalled();
    });
  });
});