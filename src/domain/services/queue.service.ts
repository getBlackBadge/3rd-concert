import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '../../common/jwt/jwt.service';
import { Concert } from '../entities/concert.entity';
import { QueueServiceInterface } from './interfaces/queue.service.interface';

@Injectable()
export class QueueService implements QueueServiceInterface {
  constructor() {}

  calculateWaitTime(cycle, maxPerCycle, qCount, reservationStartTime): Date {
    // qCount와 maxPerCycle을 사용하여 몇 번째 사이클에 배치될지를 계산
    // -1을 빼는 이유는 대기열의 1번째를 포함하여 계산하기 위해서
    const cycleCount = Math.floor((qCount - 1) / maxPerCycle); 
    
    // 각 사이클의 시작 시간은 예약 시작 시간(reservationStartTime)에서 
    // cycle 시간만큼 cycleCount만큼 더한 시점
    const activeAt = new Date(reservationStartTime.getTime() + cycleCount * cycle);

    // 최종적으로 대기열의 활성화 예상 시간을 반환
    return activeAt;
}
}