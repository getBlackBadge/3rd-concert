import { v4 as uuid } from 'uuid';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReservationFacade } from '../reservation.facade';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { SeatService } from '../../../domain/services/seat.service';
import { ReservationService } from '../../../domain/services/reservation.service';
import { ConcertService } from '../../../domain/services/concert.service';
import { JwtService } from '../../../common/jwt/jwt.service';
import { RedisNoWaitLockManager } from '../../../common/managers/locks/redis-nowait-lock.manager';

import { Concert } from '../../../domain/entities/concert.entity';
import { User } from '../../../domain/entities/user.entity';
import { DataSource } from 'typeorm';
import { GenericContainer } from 'testcontainers';
import { QueueService } from '../../../domain/services/queue.service';
import { UserService } from '../../../domain/services/user.service';
import { RedisLockManager } from '../../../common/managers/locks/redis-wait-lock.manager'
import { RedisRepository } from '../../../infrastructure/redis/redis.repository'
import { redisClient } from '../../../common/config/redis.config';
import { Queue } from '../../../domain/entities/queue.entity';
import { Seat } from '../../../domain/entities/seat.entity';
import { SchedulerService } from '../../../infrastructure/scheduler/scheduler.service';
import { createClient } from 'redis';
import { RedisClientType } from 'redis';
import { QueueStatusEnum } from '../../../common/enums/queue-status.enum';

describe('ReservationFacade', () => {
  let facade: ReservationFacade;
  let concertRepository;
  let queueRepository;
  let dataSource: DataSource;
  let userRepository;
  const concertIdGlobal = uuid();
  let jwtService = new JwtService();
  let queueService;
  let concertService;
  let userService;
  let redisRepository;
  let reservationRepository;
  let seatRepository;
  let seatService: SeatService;
  let reservationService: ReservationService;
  let redisNoWaitLockManager: RedisNoWaitLockManager;
  let schedulerService;
  let redisClient: RedisClientType;


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
      entities: [Seat, User, Reservation, Concert, Queue],
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
          provide: getRepositoryToken(Reservation),
          useValue: dataSource.getRepository(Reservation),
        },
        {
          provide: SchedulerService,
          useValue: {
            addCronJob: jest.fn(), // 필요한 메서드를 Mock 처리
          },
        },
        {
          provide: getRepositoryToken(Seat),
          useValue: dataSource.getRepository(Seat),
        },
        {
          provide: getRepositoryToken(Concert),
          useValue: dataSource.getRepository(Concert),
        },
        {
          provide: getRepositoryToken(Queue),
          useValue: dataSource.getRepository(Queue),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: RedisNoWaitLockManager,
          useValue: new RedisNoWaitLockManager(
            redisRepository,
          ),
        },
        SeatService,
        ReservationService,
        ConcertService,
        JwtService,
        ReservationFacade,
      ],
    }).compile();

    facade = module.get<ReservationFacade>(ReservationFacade);
    reservationRepository = module.get(getRepositoryToken(Reservation));
    seatRepository = module.get(getRepositoryToken(Seat));
    seatService = module.get(SeatService);
    reservationService = module.get(ReservationService);
    concertService = module.get(ConcertService);
    jwtService = module.get(JwtService);
    redisNoWaitLockManager = module.get(RedisNoWaitLockManager);

  });

  afterEach(async () => {
    // 컨테이너 정리
    try{
      await dataSource.destroy();
    } catch {
    }
  });
  it('같은 좌석에 대해 하나의 예약만 허용해야 합니다 {예상 결과 : 1개 성공 9개 실패}', async () => {
    const seatNumber = 1;
    const concertId = uuid();
    const token = 'valid-jwt-token';

    const reservationDtos = Array.from({ length: 10 }, () => ({
      seatNumber,
      userId: uuid(),
      concertId,
      token,
    }));

    // 필요한 서비스 메서드를 Mock 처리
    jest.spyOn(jwtService, 'verifyToken').mockResolvedValue({ status: QueueStatusEnum.APPROVED });
    jest.spyOn(concertService, 'verifyConcert').mockResolvedValue(true);


    const results = await Promise.allSettled(reservationDtos.map(dto => facade.reserveSeat(dto)));
    
    const fulfilledCount = results.filter(result => result.status === 'fulfilled').length;
    const rejectedCount = results.filter(result => result.status === 'rejected').length;

    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(9);
  });
});
