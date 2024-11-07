import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '../../common/jwt/jwt.service';
import { Concert } from '../entities/concert.entity';
import { QueueServiceInterface } from './interfaces/queue.service.interface';

@Injectable()
export class QueueService implements QueueServiceInterface {
  constructor() {}

  calculateWaitTime(position: number): number {
    const minutes = Math.ceil(position / 10);
    return minutes
  }
}