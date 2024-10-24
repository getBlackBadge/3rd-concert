import { v4 as uuid } from 'uuid';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Queue } from '../../../domain/entities/queue.entity';
import { User } from '../../../domain/entities/user.entity';
import { DataSource } from 'typeorm';
import { GenericContainer } from 'testcontainers';
import { UserService } from '../../../domain/services/user.service';
import { BalanceFacade } from '../balance.facade'; 
import { BalanceService } from '../../../domain/services/balance.service';

describe('QueueFacade', () => {
  let balanceFacade: BalanceFacade; // BalanceFacade 추가
  let dataSource: DataSource;
  let userRepository;
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
      entities: [User],
      synchronize: true,
      extra: {
        max: 10, // 최대 커넥션 수를 10으로 설정
      },
    });
    await dataSource.initialize();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: dataSource.getRepository(User),
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
        BalanceFacade,
        BalanceService
      ],
    }).compile();

    balanceFacade = module.get<BalanceFacade>(BalanceFacade);
    userRepository = module.get(getRepositoryToken(User));
    userService = module.get(UserService);

  });

  afterEach(async () => {
    // 컨테이너 정리
    try{
      await dataSource.destroy();
    } catch {
    }
  });

  it('50포인트 충전 후 70번의 1포인트 사용 시 50번 성공하고 20번 실패해야 한다', async () => {
    const userId = uuid();
    await userRepository.save({ id: userId, username: 'test_user', balance: 0 });

    // Step 1: 50포인트 충전
    await balanceFacade.chargeBalance(userId, 50);

    // Step 2: 동시에 70번의 1포인트 사용 요청
    const usageRequests = Array.from({ length: 70 }, () =>
      balanceFacade.decreaseBalance(userId, 1).then(
        () => ({ success: true }),
        (error) => ({ success: false, error })
      )
    );
    // Step 3: 모든 사용 요청 완료 대기 중
    console.log('Step 3: 모든 사용 요청 완료 대기 중...');
    const results = await Promise.all(usageRequests);
    console.log('모든 사용 요청 완료.');

    // Step 4: 성공과 실패 횟수 계산
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.filter(result => !result.success).length;
    console.log(`성공 횟수: ${successCount}, 실패 횟수: ${failureCount}`);

    // Step 5: 50번 성공, 20번 실패 확인
    expect(successCount).toBe(50);
    expect(failureCount).toBe(20);
  });
});