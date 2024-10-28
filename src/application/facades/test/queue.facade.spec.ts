import { v4 as uuid } from 'uuid';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueueFacade } from '../queue.facade'; // 경로에 따라 import 조정
import { Queue } from '../../../domain/entities/queue.entity';
import { Concert } from '../../../domain/entities/concert.entity';
import { User } from '../../../domain/entities/user.entity';
import { JwtService } from '../../../common/jwt/jwt.service';
import { DataSource } from 'typeorm';
import { GenericContainer } from 'testcontainers';
import { QueueService } from '../../../domain/services/queue.service';
import { ConcertService } from '../../../domain/services/concert.service';
import { UserService } from '../../../domain/services/user.service';

describe('QueueFacade', () => {
  let facade: QueueFacade;
  let concertRepository;
  let queueRepository;
  let dataSource: DataSource;
  let userRepository;
  const concertIdGlobal = uuid();
  let jwtService = new JwtService();
  let queueService;
  let concertService;
  let userService;

  beforeAll(() => {
    jest.setTimeout(20000); // 전체 테스트 스위트에 대한 타임아웃을 20초로 설정
  });

  beforeEach(async () => {
    // PostgreSQL 컨테이너 시작
    const container = await new GenericContainer('postgres')
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
        POSTGRES_DB: 'concert_service_db',
      })
      .withExposedPorts(5432)
      .start();

    const port = container.getMappedPort(5432);
    const host = container.getHost();

    // TypeORM DataSource 초기화
    dataSource = new DataSource({
      type: 'postgres',
      host: host,
      port: port,
      username: 'postgres',
      password: 'password',
      database: 'concert_service_db',
      entities: [Queue, Concert, User],
      synchronize: true,
      extra: {
        max: 10, // 최대 커넥션 수를 10으로 설정
      },
    });
    await dataSource.initialize();
    //max connetcion default인 10개의 커넥션이 풀

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Queue),
          useValue: dataSource.getRepository(Queue),
        },
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
          useValue: new QueueService(
            dataSource.getRepository(Queue),
            dataSource.getRepository(Concert),
            jwtService,
            dataSource
          ),
        },
        {
          provide: ConcertService,
          useValue: new ConcertService(
            dataSource.getRepository(Concert),
            dataSource.getRepository(Queue),
          ),
        },
        {
          provide: UserService,
          useValue: new UserService(
            dataSource.getRepository(User),
            dataSource.getRepository(Queue),
          ),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        QueueFacade,
        JwtService,
      ],
    }).compile();

    facade = module.get<QueueFacade>(QueueFacade);
    concertRepository = module.get(getRepositoryToken(Concert));
    queueRepository = module.get(getRepositoryToken(Queue));
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    queueService = module.get(QueueService);
    concertService = module.get(ConcertService);
    userService = module.get(UserService);

    // 콘서트 테이블에 테스트 데이터 삽입
    await concertRepository.save({
      id: concertIdGlobal,
      name: '테스트 콘서트',
      venue: '테스트 장소',
      concert_date: new Date(), // 콘서트 날짜 설정
      max_seats: 100, // 최대 좌석 수 100으로 설정
      queue_count: 0, // 대기열 수를 0으로 시작
      max_queue: 50, // 최대 대기열 수 제한 설정
    });
  });

  afterEach(async () => {
    // 컨테이너 정리
    try{
      await dataSource.destroy();
    } catch {
    }
  });

  it('동시 요청을 처리하고 순차적인 대기열 위치를 할당해야 합니다', async () => {
    const reqAmount = 100;
    const users = Array.from({ length: reqAmount }, () => ({
      id: uuid(), // UUID 생성
      username: `user_${Math.random().toString(36).substring(2, 7)}`, // 랜덤한 사용자 이름
      isAdmin: false, // 기본값 설정
      balance: 0, // 기본값 설정
    }));

    // 사용자 테이블에 테스트 데이터 삽입
    await userRepository.save(users);

    const createTokenDtos = users.map(user => ({ userId: user.id, concertId: concertIdGlobal }));

    // Create multiple instances of QueueFacade and invoke them concurrently
    const results = await Promise.all(createTokenDtos.map(dto => {
      return facade.createToken(dto); // Call the service method
    }));

    const uniquePosition = new Set();
    results.forEach(result => {
      expect(result).toBeDefined();
      const decodedResult =jwtService.decodeToken(result)
      uniquePosition.add(decodedResult["queuePosition"]);
    });

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(reqAmount);
    expect(uniquePosition.size).toBe(reqAmount);
  });
});
