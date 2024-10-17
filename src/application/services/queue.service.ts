import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateTokenDto } from '../../api/dto/create-token.dto';
import { QueueStatusResDto, QueueStatusRequestDto } from '../../api/dto/queue-status.dto';
import { Queue } from '../../domain/entities/queue.entity';
import { v4 as uuid } from 'uuid';
import { JwtService } from '../../common/jwt/jwt.service';
import { Concert } from '../../domain/entities/concert.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,
    @InjectRepository(Concert)
    private concertRepository: Repository<Concert>,
    private jwtService: JwtService,
    private readonly dataSource: DataSource

  ) {}

  async createToken(createTokenDto: CreateTokenDto): Promise<string> {
    console.log(`createToken 시작: userId=${createTokenDto.userId}, concertId=${createTokenDto.concertId}`);
    
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      console.log('트랜잭션 시작');
  
      try {
        console.log(`concert ID ${createTokenDto.concertId}에 대한 락 획득 시도`);
        await transactionalEntityManager.query(
          'SELECT id FROM concert WHERE id = $1 FOR UPDATE',
          [createTokenDto.concertId]
        );
        console.log('락 획득 쿼리 실행 완료');
  
        console.log('현재 대기열 수 조회 시작');
        const concert = await this.concertRepository.findOne({
            where: { id: createTokenDto.concertId },
            select: ['id', 'queue_count'],
          });
        
        if (!concert) {
          throw new Error('콘서트를 찾을 수 없습니다.');
        }
        const queueCount = concert.queue_count;
        console.log(`현재 대기열 수: ${queueCount}`);
  
        console.log('새로운 대기열 엔트리 생성');
        const queueEntry = this.queueRepository.create({
          user: { id: createTokenDto.userId },
          concert: { id: createTokenDto.concertId },
          queue_position: queueCount + 1,
        });
        console.log(`생성된 엔트리: ${JSON.stringify(queueEntry)}`);
        console.log('대기열 엔트리 저장 시작');
        const savedEntry = await transactionalEntityManager.save(Queue, queueEntry);
        console.log(`저장된 엔트리: ${JSON.stringify(savedEntry)}`);

        // queue_count 업데이트
        await transactionalEntityManager.update('Concert', createTokenDto.concertId, {
          queue_count: queueCount + 1,
        });
        console.log(`Concert queue_count 업데이트: ${queueCount + 1}`);

        // JWT 토큰 생성
        const tokenPayload = {
          userId: savedEntry.user.id,
          concertId: savedEntry.concert.id,
          queuePosition: savedEntry.queue_position,
        };
        const token = this.jwtService.generateToken(tokenPayload);

        console.log(`createToken 완료: token=${token}`);
        return token;
      } catch (error) {
        console.error(`createToken 에러 발생: ${error.message}`);
        throw error;
      }
    });
  }

  async getQueueStatus(getQueueStatusDto: QueueStatusRequestDto): Promise<QueueStatusResDto> {
    // JWT 토큰 검증 및 디코딩
    const decodedToken = this.jwtService.verifyToken(getQueueStatusDto.token);
    
    // 토큰에서 필요한 정보 추출
    const { userId, concertId, queuePosition } = decodedToken;
  
    const userEntry = await this.queueRepository.findOne({
      where: { user: { id: userId }, concert: { id: concertId } },
      relations: ['user', 'concert'],
    });
  
    if (!userEntry) {
      throw new Error('유저가 대기열에 존재하지 않습니다.');
    }
  
    const queueLength = await this.queueRepository.count({
      where: { concert: { id: concertId } },
    });
  
    return {
      userId,
      concertId,
      token: getQueueStatusDto.token,
      position: queuePosition,
      queueLength,
      // waitTime: userEntry.wait_time,
    };
  }

  private calculateWaitTime(position: number): string {
    // 간단한 대기 시간 계산 로직 (예: 1분당 10명 처리)
    const minutes = Math.ceil(position / 10);
    return `${minutes} minutes`;
  }
}