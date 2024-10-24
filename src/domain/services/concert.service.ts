
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Concert } from '../entities/concert.entity';
import { Queue } from '../entities/queue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConcertServiceInterface } from './interfaces/concert.service.interface';

@Injectable()
export class ConcertService implements ConcertServiceInterface {
  constructor(
    @InjectRepository(Concert)
    private readonly concertRepository: Repository<Concert>,
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>
  ) {}

  async getConcertByQueueId(queueId: string) {
    const queue = await this.queueRepository.findOne({where: {id: queueId}})
    if (!queue) {
      throw new NotFoundException('해당 큐를 찾을 수 없습니다.');
    }
    const concertId = queue.concert_id
    const concert = this.getConcertById(concertId)
    return concert
  }

  async getConcertById(concertId: string) {
    const concert = this.concertRepository.findOne({where: { id: concertId }})
    if (!concert) {
      throw new NotFoundException('해당 콘서트를 찾을 수 없습니다.');
    }
    return concert
  }

  async verifyConcert(concertId: string): Promise<boolean> {
    const concert = this.concertRepository.findOne({where: { id: concertId }})
    if (!concert) {
      throw new NotFoundException('해당 콘서트를 찾을 수 없습니다.');
    }
    return true
  }

  async getConcertByDate(date: Date): Promise<Concert> {
    const concert = await this.concertRepository.findOne({ where: { concert_date: date } });
    if (!concert) {
      throw new NotFoundException('해당 날짜의 콘서트를 찾을 수 없습니다.');
    }
    return concert
  }

}