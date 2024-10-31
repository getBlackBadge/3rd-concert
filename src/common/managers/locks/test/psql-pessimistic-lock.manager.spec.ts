import { Test, TestingModule } from '@nestjs/testing';
import { PeLockManager } from '../psql-pessimistic-lock.manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Concert } from '../../../../domain/entities/concert.entity';
import { Queue } from '../../../../domain/entities/queue.entity';
import { User } from '../../../../domain/entities/user.entity';
import { Seat } from '../../../../domain/entities/seat.entity';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { DataSource, Repository } from 'typeorm';
import { GenericContainer } from 'testcontainers';
import { v4 as uuidv4 } from 'uuid';

describe('LockManager', () => {
    let lockManager: PeLockManager;
    let concertRepository: Repository<Concert>;
    let queueRepository: Repository<Queue>;
    let userRepository: Repository<User>;
    let seatRepository: Repository<Seat>;
    let reservationRepository: Repository<Reservation>;
    let dataSource: DataSource;
    let container: GenericContainer;

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
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PeLockManager,
                {
                    provide: getRepositoryToken(Concert),
                    useValue: dataSource.getRepository(Concert),
                },
                {
                    provide: getRepositoryToken(Queue),
                    useValue: dataSource.getRepository(Queue),
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: dataSource.getRepository(User),
                },
                {
                    provide: getRepositoryToken(Seat),
                    useValue: dataSource.getRepository(Seat),
                },
                {
                    provide: getRepositoryToken(Reservation),
                    useValue: dataSource.getRepository(Reservation),
                },
                {
                    provide: DataSource,
                    useValue: dataSource,
                },
            ],
        }).compile();

        lockManager = module.get<PeLockManager>(PeLockManager);
        concertRepository = module.get<Repository<Concert>>(getRepositoryToken(Concert));
        queueRepository = module.get<Repository<Queue>>(getRepositoryToken(Queue));
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        seatRepository = module.get<Repository<Seat>>(getRepositoryToken(Seat));
        reservationRepository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
    });

    afterEach(async () => {
        // 컨테이너 정리
        try{
          await dataSource.destroy();
        } catch {
        }
      });

    it('잠금을 획득하고 작업을 성공적으로 실행해야 합니다', async () => {
        const resourceId = uuidv4();
        const resourceType = 'concert';
        const mockOperation = jest.fn().mockResolvedValue('success');

        await concertRepository.save({
            id: resourceId,
            name: '테스트 콘서트',
            venue: '테스트 장소',
            concert_date: new Date(), 
            max_seats: 50, 
            max_queue: 100, 
            queue_count: 0,
        }); // 데이터베이스를 미리 채웁니다

        const result = await lockManager.withLockBySrc(resourceId, resourceType, mockOperation);

        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalled();
    });
    
    it('lock 안에서 queue_count를 +1 씩 100번 실행하면 동시 수정 없이 queue_count를 100으로 증가시킬 수 있어야 한다', async () => {
        const resourceId = uuidv4();
        const resourceType = 'concert';
        const initialName = '초기 콘서트';
        
        // 리소스를 초기화
        await concertRepository.save({
            id: resourceId,
            name: initialName,
            venue: '테스트 장소',
            concert_date: new Date(),
            max_seats: 50,
            max_queue: 100,
            queue_count: 0,
        });
    
        // 100번의 증가 요청을 비동기적으로 실행할 함수
        const incrementQueueCount = async () => {
            const mockOperation = async (manager) => {
                const concert = await manager.findOneBy(Concert, { id: resourceId });
                if (concert) {
                    concert.queue_count += 1;
                    await manager.save(concert);
                }
                return concert;
            };
    
            const newLockManager = new PeLockManager(concertRepository, queueRepository, userRepository, seatRepository, reservationRepository, dataSource);
            return await newLockManager.withLockBySrc(resourceId, resourceType, mockOperation);
        };
    
        // 100개의 비동기 작업 생성
        const promises = Array.from({ length: 100 }, () => incrementQueueCount());
    
        // 모든 요청을 동시에 실행
        await Promise.allSettled(promises);
    
        // 데이터베이스에서 업데이트된 값을 확인
        const updatedResource = await concertRepository.findOneBy({ id: resourceId });
        expect(updatedResource.queue_count).toBe(100);
    });

    it('반대로 LockManager 없이 동시에 수정할 시, queue_count를 100으로 증가시키는 데 실패해야 한다', async () => {
        const resourceId = uuidv4();
        const resourceType = 'concert';
        const initialName = '초기 콘서트';
    
        // 리소스를 초기화
        await concertRepository.save({
            id: resourceId,
            name: initialName,
            venue: '테스트 장소',
            concert_date: new Date(),
            max_seats: 50,
            max_queue: 100,
            queue_count: 0,
        });
    
        // 100번의 증가 요청을 비동기적으로 실행할 함수 (LockManager 없음)
        const incrementQueueCountWithoutLock = async () => {
            const mockOperation = async (manager) => {
                const concert = await manager.findOneBy(Concert, { id: resourceId });
                if (concert) {
                    // 1초 대기 후 queue_count를 증가시킴
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    concert.queue_count += 1;
                    await manager.save(concert);
                }
                return concert; 
            };
    
            return await mockOperation(concertRepository.manager); //(LockManager 없음)
        };
    
        // 100개의 비동기 작업 생성
        const promises = Array.from({ length: 100 }, () => incrementQueueCountWithoutLock());
    
        // 모든 요청을 동시에 실행
        await Promise.all(promises);
    
        // 데이터베이스에서 업데이트된 값을 확인
        const updatedResource = await concertRepository.findOneBy({ id: resourceId });
        
        // queue_count는 100이 아닐 것으로 예상
        expect(updatedResource.queue_count).not.toBe(100);
    });
    
    it('리소스를 찾을 수 없으면 오류를 발생시켜야 한다', async () => {
        const resourceId = uuidv4();
        const resourceType = 'concert';
        const mockOperation = jest.fn();

        await expect(lockManager.withLockBySrc(resourceId, resourceType, mockOperation))
            .rejects.toThrow(`리소스 ${resourceType} ID ${resourceId}를 찾을 수 없습니다`);
    });

    it('오류 발생 시 트랜잭션을 롤백해야 한다', async () => {
        const resourceId = uuidv4();
        const resourceType = 'concert';
        const mockOperation = jest.fn().mockRejectedValue(new Error('작업 실패'));

        await concertRepository.save({
            id: resourceId,
            name: '테스트 콘서트',
            venue: '테스트 장소',
            concert_date: new Date(), 
            max_seats: 50, 
            max_queue: 100, 
            queue_count: 0,
        }); // 데이터베이스를 미리 채웁니다

        await expect(lockManager.withLockBySrc(resourceId, resourceType, mockOperation))
            .rejects.toThrow('작업 실패');
    });
});
