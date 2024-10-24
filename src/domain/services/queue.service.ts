import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Queue } from '../entities/queue.entity';
import { JwtService } from '../../common/jwt/jwt.service';
import { Concert } from '../entities/concert.entity';
import { QueueServiceInterface } from './interfaces/queue.service.interface';

@Injectable()
export class QueueService implements QueueServiceInterface {
  constructor(
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,
    @InjectRepository(Concert)
    private concertRepository: Repository<Concert>,
    private jwtService: JwtService,
    private readonly dataSource: DataSource

  ) {}

  async getQueueCountByConcertId(
    concertId: string, 
    concertRepository:Repository<Concert>=this.concertRepository
  ): Promise<number> {

    const concert = await concertRepository.findOne({
      where: { id: concertId },
    });
    if (!concert) {
      throw new Error('콘서트를 찾을 수 없습니다.');
    }
    const queueCount = concert.queue_count;
    return queueCount
  }

  async createQueue(
    userId: string, 
    concertId: string, 
    queueCount:number,
    token:string,
    queueRepository:Repository<Queue>=this.queueRepository
  ): Promise<void> {
    queueRepository.save({
      user_id: userId,
      concert_id: concertId,
      queue_position: queueCount,
      wait_time_minutes: this.calculateWaitTime(queueCount + 1),
      token: token
    });
    
  }
  async updateQueueCount(
    concertId: string, 
    queueCount: number,
    concertRepository:Repository<Concert>=this.concertRepository
  ): Promise<void> {
    await concertRepository.update(concertId, {
      queue_count: queueCount,
    });
  }

  async getQueueLenByConcertId(concertId: any): Promise<number> {
    const queueLength = await this.queueRepository.count({
      where: { concert_id: concertId },
    });
    return queueLength
  }

  private calculateWaitTime(position: number): number {
    // 간단한 대기 시간 계산 로직 (예: 1분당 10명 처리)
    const minutes = Math.ceil(position / 10);
    return minutes
  }
}