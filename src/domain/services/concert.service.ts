
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Concert } from '../entities/concert.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConcertServiceInterface } from './interfaces/concert.service.interface';

@Injectable()
export class ConcertService implements ConcertServiceInterface {
  constructor(
    @InjectRepository(Concert)
    private readonly concertRepository: Repository<Concert>,

  ) {}

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