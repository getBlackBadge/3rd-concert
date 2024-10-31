import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ILockManager } from './interface/lock.manager.interface';
import { Concert } from '../../../domain/entities/concert.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from '../../../domain/entities/queue.entity';
import { User } from '../../../domain/entities/user.entity';
import { Seat } from '../../../domain/entities/seat.entity';
import { Reservation } from '../../../domain/entities/reservation.entity';

@Injectable()
export class PeLockManager implements ILockManager{
    constructor(    
        @InjectRepository(Concert)
        private concertRepository: Repository<Concert>,
        @InjectRepository(Queue)
        private queueRepository: Repository<Queue>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Seat)
        private seatRepository: Repository<Seat>,
        @InjectRepository(Reservation)
        private reservationRepository: Repository<Reservation>,
    
        private readonly dataSource: DataSource,
      ) {}


    async withLockBySrc<T>(resourceId: string, resourceType: string, operation: (transactionalEntityManager) => Promise<T>): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const targetRepo = this.selectRepoByName(resourceType);
            const lockRepository = queryRunner.manager.withRepository(targetRepo);
            // concertId에 대해 pessimistic_write 락을 사용하여 동시성 제어
            const lock = await lockRepository.findOne({
                where: { id: resourceId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!lock) {
                throw new Error(`resource ${resourceType} with ID ${resourceId} not found`);
            }

            console.log(`${resourceType} ID ${resourceId}에 대한 락 획득.`);

            // cb
            const result = await operation(queryRunner.manager);

            await queryRunner.commitTransaction();
            console.log(`Transaction for ${resourceType} ID ${resourceId} committed successfully.`);
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    
    private selectRepoByName(name: string): Repository<any> {
        switch (name) {
            case 'concert':
                return this.concertRepository;
            case 'queue':
                return this.queueRepository;
            case 'user':
                return this.userRepository;
            case 'seat':
                return this.seatRepository;
            case 'reservation':
                return this.reservationRepository;
            default:
                throw new Error(`Repository for ${name} not found`);
            }
        }
        
        }