import { v4 as uuid } from 'uuid';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueueFacade } from '../queue.facade';
import { Concert } from '../../../domain/entities/concert.entity';
import { User } from '../../../domain/entities/user.entity';
import { JwtService } from '../../../common/jwt/jwt.service';
import { DataSource } from 'typeorm';
import { GenericContainer } from 'testcontainers';
import { QueueService } from '../../../domain/services/queue.service';
import { ConcertService } from '../../../domain/services/concert.service';
import { UserService } from '../../../domain/services/user.service';
import { RedisLockManager } from '../../../common/managers/locks/redis-wait-lock.manager'
import { RedisRepository } from '../../../infrastructure/redis/redis.repository'
import { redisClient } from '../../../common/config/redis.config';
import { createClient } from 'redis';
import { RedisClientType } from 'redis';
import { QueueStatusReqDto, QueueStatusResDto } from '../../../presentation/dto/queue-status.controller.dto';
import { QueueStatusEnum } from '../../../common/enums/queue-status.enum'

describe('QueueFacade', () => {
  let facade: QueueFacade;
  let concertRepository;
  let queueRepository;
  let dataSource: DataSource;
  let userRepository;
  const concertIdGlobal = uuid();
  const userIdGlobal = uuid();
  let jwtService = new JwtService();
  let queueService;
  let concertService;
  let userService;
  let redisClient
  let redisRepository;

  const mockUserService = {
    getUserById: jest.fn(),
  };

  const mockConcertService = {
    getConcertByQueueId: jest.fn(),
  };

  const mockJwtService = {
    verifyToken: jest.fn(),
    generateToken: jest.fn(),
  };

  beforeAll(() => {
    jest.setTimeout(20000); // 전체 테스트 스위트에 대한 타임아웃을 20초로 설정
  });

  beforeEach(async () => {
    const redisContainer = await new GenericContainer('redis')
    .withExposedPorts(6379)
    .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);

    redisClient = await createClient(
        {
            url: `redis://${redisHost}:${redisPort}`
        }
    )
    .on('error', err => console.log('Redis 클라이언트 오류', err))
    .connect() as RedisClientType;
    redisRepository = new RedisRepository(redisClient);
    // PostgreSQL 컨테이너 시작
    const psqlContainer = await new GenericContainer('postgres')
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
        POSTGRES_DB: 'concert_service_db',
      })
      .withExposedPorts(5432)
      .start();

    const port = psqlContainer.getMappedPort(5432);
    const host = psqlContainer.getHost();

    // TypeORM DataSource 초기화
    dataSource = new DataSource({
      type: 'postgres',
      host: host,
      port: port,
      username: 'postgres',
      password: 'password',
      database: 'concert_service_db',
      entities: [Concert, User],
      synchronize: true,
      extra: {
        max: 10, // 최대 커넥션 수를 10으로 설정
      },
    });
    await dataSource.initialize();
    // 최대 커넥션 기본값인 10개의 커넥션이 풀

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Concert),
          useValue: dataSource.getRepository(Concert),
        },
        {
          provide: getRepositoryToken(User),
          useValue: dataSource.getRepository(User),
        },
        {
          provide: QueueService,
          useValue: new QueueService(),
        },
        {
          provide: ConcertService,
          useValue: new ConcertService(
            dataSource.getRepository(Concert),
          ),
        },
        {
          provide: UserService,
          useValue: new UserService(
            dataSource.getRepository(User),
          ),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: RedisLockManager,
          useValue: new RedisLockManager(
            redisRepository,
          ),
        },
        {
          provide: RedisRepository,
          useValue: redisRepository,
        },
        QueueFacade,
        JwtService,
      ],
    }).compile();

    facade = module.get<QueueFacade>(QueueFacade);
    concertRepository = module.get(getRepositoryToken(Concert));
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    queueService = module.get(QueueService);
    concertService = module.get(ConcertService);
    userService = module.get(UserService);

    const now = new Date()
    // 콘서트 테이블에 테스트 데이터 삽입
    await concertRepository.save({
      id: concertIdGlobal,
      name: '테스트 콘서트',
      venue: '테스트 장소',
      concert_date: now, // 콘서트 날짜 설정
      max_seats: 100, // 최대 좌석 수 100으로 설정

      reservation_start_time: now
    });

    // 사용자 테이블에 테스트 데이터 삽입
    await userRepository.save({
      id: userIdGlobal, // UUID 생성
      username: `user_${Math.random().toString(36).substring(2, 7)}`, // 랜덤한 사용자 이름
      isAdmin: false, // 기본값 설정
      balance: 0, // 기본값 설정
    });

  });

  afterEach(async () => {
    // 컨테이너 정리
    try{
      await dataSource.destroy();
    } catch {
    }
  });

  it('동시 요청을 처리하고 순차적인 대기열 위치를 할당해야 합니다 {예상 결과 : 동시에 1000개 요청 시도 후 1 - 1000 까지 모든 순서가 중복없이 부여}', async () => {
    const reqAmount = 1000;
    // const reqAmount = 10;
    const createTokenDtos = Array.from({ length: reqAmount }, () => ({ userId: uuid(), concertId: concertIdGlobal }));

    // QueueFacade의 여러 인스턴스를 생성하고 동시에 호출
    const results = await Promise.all(createTokenDtos.map(dto => {
      return facade.createToken(dto); // 서비스 메서드 호출
    }));

    const uniquePosition = new Set();
    results.forEach(result => {
      expect(result).toBeDefined();
      const decodedResult = jwtService.decodeToken(result)
      uniquePosition.add(decodedResult["queuePosition"]);
    });

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(reqAmount);
    expect(uniquePosition.size).toBe(reqAmount);
  });

  it('activeAt을 잘 배분하는지 확인합니다. 1000개의 요청이 있고 10초당 250명씩 받는다면 10초당 4번 250명씩 activeAt 시간을 배정받아야 합니다', async () => {

    process.env.CYCLE_DURATION_MS = '10000'; // Set cycle to 10000 ms
    process.env.MAX_PER_CYCLE = '250'; // Set maxPerCycle to 250

    const reqAmount = 1000;

    // const reqAmount = 10;
    const createTokenDtos = Array.from({ length: reqAmount }, () => ({ userId: uuid(), concertId: concertIdGlobal }));

    // QueueFacade의 여러 인스턴스를 생성하고 동시에 호출
    const results = await Promise.all(createTokenDtos.map(dto => {
      return facade.createToken(dto); // 서비스 메서드 호출
    }));

    const activeAtCount = {};
    results.forEach(result => {
      expect(result).toBeDefined();
      const decodedResult = jwtService.decodeToken(result)
      // activeAt을 기준으로 개수 카운트
      const activeAtValue = decodedResult["activeAt"];
      activeAtCount[activeAtValue] = (activeAtCount[activeAtValue] || 0) + 1;
    });

    // `activeAt` keys는 4사이클이니까 4입니다
    expect(Object.keys(activeAtCount).length).toBe(4);

    // 10초마다 각 값은 1000/4 = 250명씩 균일하게 배분되어야합니다
    Object.values(activeAtCount).forEach(count => {
      expect(count).toBe(250);
    });
  });



  describe('getQueueStatus', () => {
    it('activeAt 시점이 도래했다면 AVAILABLE을 리턴해야합니다', async () => {
      const now = new Date();
      const userId = userIdGlobal
      const concertId = uuid()
      const decodedToken = {
        userId: userId,
        concertId: concertId,
        queuePosition: 1,
        activeAt: new Date(now.getTime() - 1000 * 60), // 1 minute ago
      };
      const token = jwtService.generateToken(decodedToken)
      const getQueueStatusDto: QueueStatusReqDto = { token: token };

      mockUserService.getUserById.mockResolvedValue({ id: userId });
      mockConcertService.getConcertByQueueId.mockResolvedValue({ id: concertId });


      const result = await facade.getQueueStatus(getQueueStatusDto);

      expect(result.status).toBe(QueueStatusEnum.AVAILABLE);

    });
    it('activeAt 시점이 도래하지 않았다면 NOTAVAILABLE을 리턴해야합니다', async () => {
      const now = new Date();
      const userId = userIdGlobal
      const concertId = uuid()
      const decodedToken = {
        userId: userId,
        concertId: concertId,
        queuePosition: 1,
        activeAt: new Date(now.getTime() + 1000 * 60 * 10), // 10 minute later
      };
      const token = jwtService.generateToken(decodedToken)
      const getQueueStatusDto: QueueStatusReqDto = { token: token };

      mockUserService.getUserById.mockResolvedValue({ id: userId });
      mockConcertService.getConcertByQueueId.mockResolvedValue({ id: concertId });


      const result = await facade.getQueueStatus(getQueueStatusDto);

      expect(result.status).toBe(QueueStatusEnum.NOTAVAILABLE);

    });
   
  });
});
