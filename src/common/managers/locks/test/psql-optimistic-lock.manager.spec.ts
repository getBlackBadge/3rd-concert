// import { Test, TestingModule } from '@nestjs/testing';
// import { OpLockManager } from '../psql-optimistic-lock.manager'; // Adjust the path if necessary
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Concert } from '../../../../domain/entities/concert.entity';
// import { Queue } from '../../../../domain/entities/queue.entity';
// import { User } from '../../../../domain/entities/user.entity';
// import { Seat } from '../../../../domain/entities/seat.entity';
// import { Reservation } from '../../../../domain/entities/reservation.entity';
// import { DataSource, Repository } from 'typeorm';
// import { GenericContainer } from 'testcontainers';
// import { v4 as uuidv4 } from 'uuid';
// describe('LockManager', () => {
//     let lockManager: OpLockManager;
//     let concertRepository: Repository<Concert>;
//     let queueRepository: Repository<Queue>;
//     let userRepository: Repository<User>;
//     let seatRepository: Repository<Seat>;
//     let reservationRepository: Repository<Reservation>;
//     let dataSource: DataSource;
//     let container: GenericContainer;

//     beforeAll(() => {
//         jest.setTimeout(20000); // 전체 테스트 스위트에 대한 타임아웃을 20초로 설정
//     });

//     beforeEach(async () => {
//         // Start PostgreSQL container
//         const container = await new GenericContainer('postgres')
//             .withEnvironment({
//             POSTGRES_USER: 'postgres',
//             POSTGRES_PASSWORD: 'password',
//             POSTGRES_DB: 'concert_service_db',
//             })
//             .withExposedPorts(5432)
//             .start();
    
//         const port = container.getMappedPort(5432);
//         const host = container.getHost();
    
//         // TypeORM DataSource 초기화
//         dataSource = new DataSource({
//             type: 'postgres',
//             host: host,
//             port: port,
//             username: 'postgres',
//             password: 'password',
//             database: 'concert_service_db',
//             entities: [Queue, Concert, User],
//             synchronize: true,
//             extra: {
//             max: 10, // 최대 커넥션 수를 10으로 설정
//             },
//         });
//         await dataSource.initialize();
//     });

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 OpLockManager,
//                 {
//                     provide: getRepositoryToken(Concert),
//                     useValue: dataSource.getRepository(Concert),
//                 },
//                 {
//                     provide: getRepositoryToken(Queue),
//                     useValue: dataSource.getRepository(Queue),
//                 },
//                 {
//                     provide: getRepositoryToken(User),
//                     useValue: dataSource.getRepository(User),
//                 },
//                 {
//                     provide: getRepositoryToken(Seat),
//                     useValue: dataSource.getRepository(Seat),
//                 },
//                 {
//                     provide: getRepositoryToken(Reservation),
//                     useValue: dataSource.getRepository(Reservation),
//                 },
//                 {
//                     provide: DataSource,
//                     useValue: dataSource,
//                 },
//             ],
//         }).compile();

//         lockManager = module.get<OpLockManager>(OpLockManager);
//         concertRepository = module.get<Repository<Concert>>(getRepositoryToken(Concert));
//         queueRepository = module.get<Repository<Queue>>(getRepositoryToken(Queue));
//         userRepository = module.get<Repository<User>>(getRepositoryToken(User));
//         seatRepository = module.get<Repository<Seat>>(getRepositoryToken(Seat));
//         reservationRepository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
//     });

//     afterEach(async () => {
//         // 컨테이너 정리
//         try{
//           await dataSource.destroy();
//         } catch {
//         }
//       });
    
//       it('좌석을 하나를 10이 수정하려하면 9개는 실패해야한다.', async () => {
//         const resourceId = uuidv4();
//         const resourceType = 'concert';
//         const initialName = 'Initial Concert';
        
//         // Initialize the resource
//         await concertRepository.save({
//             id: resourceId,
//             name: initialName,
//             venue: 'Test Venue',
//             concert_date: new Date(),
//             updated_at: new Date(),
//             max_seats: 50,
//             max_queue: 100,
//             queue_count: 0,
//         });
    
//         const incrementQueueCount = async () => {
//             const mockOperation = async (manager) => {
//                 let result
//                 const concert = await manager.findOneBy(Concert, { id: resourceId, lock: { mode: 'optimistic', version: Concert.updated_at }},);
//                 console.log("concert")
//                 console.log(concert)
//                 if (concert) {
//                     concert.queue_count += 1;
//                     concert.updated_at = new Date()
//                     result = await manager.save(concert);
//                 }
//                 console.log(result)

//                 return result;
//             };
    
//             const newLockManager = new OpLockManager(concertRepository, queueRepository, userRepository, seatRepository, reservationRepository, dataSource);
//             return await newLockManager.withLockBySrc(resourceId, resourceType, mockOperation);
//         };
    
//         // 10개의 비동기 작업 생성
//         const promises = Array.from({ length: 2 }, () => incrementQueueCount());
    
//         // Execute all requests
//         const results = await Promise.allSettled(promises);
//         console.log(results)
    
//         // // Check the results to see how many operations succeeded
//         const successCount = results.filter(result => result.status === 'fulfilled').length;
//         expect(successCount).toBe(1); // Only one operation should succeed
//         // 데이터베이스에서 업데이트된 값을 확인

//     },60000);
    
// });
