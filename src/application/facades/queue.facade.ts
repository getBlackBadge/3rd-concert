import { Injectable } from '@nestjs/common';
import { CreateTokenReqDto } from '../../presentation/dto/create-token.dto';
import { QueueStatusResDto, QueueStatusRequestDto } from '../../presentation/dto/queue-status.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '../../common/jwt/jwt.service';
import { QueueService } from '../../domain/services/queue.service';
import { ConcertService } from '../../domain/services/concert.service';
import { UserService } from '../../domain/services/user.service';
import { Concert } from '../../domain/entities/concert.entity';
import { Queue } from '../../domain/entities/queue.entity';
import { RedisLockManager } from '../../common/managers/locks/redis-wait-lock.manager';
import { QueueStatusEnum } from '../../common/enums/queue-status.enum';
@Injectable()
export class QueueFacade {
  constructor(
    @InjectRepository(Concert)
    private concertRepository: Repository<Concert>,
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,

    private readonly queueService: QueueService,
    private readonly concertService: ConcertService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private jwtService: JwtService,
    private redisLockManager: RedisLockManager
  ) {}

  async createToken(createTokenDto: CreateTokenReqDto): Promise<string> {
      const { userId, concertId } = createTokenDto;
      const concert = await this.concertService.getConcertById(concertId);


      return await this.redisLockManager.withLockBySrc(concertId, "concert", async () => {

        return await this.dataSource.transaction(async (transactionalEntityManager) => {
          console.log(`concert ID ${concertId}에 대한 락 획득. userId : ${userId}`);
      
          let concertRepository = transactionalEntityManager.withRepository(this.concertRepository);
          let queueRepository = transactionalEntityManager.withRepository(this.queueRepository);
          const concert = await concertRepository.findOne({
            where: { id: concertId },
          });
  
  
          const queueCount = await this.queueService.getQueueCountByConcertId(concertId, concertRepository)
  
          const newQCount = queueCount + 1 
          // JWT 토큰 생성
          const tokenPayload = {
            userId: createTokenDto.userId,
            concertId: createTokenDto.concertId,
            queuePosition: queueCount + 1,
          };
          const token = this.jwtService.generateToken(tokenPayload);
          // console.log('새로운 대기열 엔트리 생성');
          await this.queueService.createQueue(userId, concertId, newQCount, token, queueRepository)
          console.log(`concert queue_count 1 증가 queueCount: ${queueCount + 1}`);
          await this.queueService.updateQueueCount(concertId, newQCount, concertRepository)
          if (!token) {
            throw new Error('Token generation failed');
          }
          return token;
        }
        )
      } ) 
    }
      

  async getQueueStatus(getQueueStatusDto: QueueStatusRequestDto): Promise<QueueStatusResDto> {
    // JWT 토큰 검증 및 디코딩
    const decodedToken = await this.jwtService.verifyToken(getQueueStatusDto.token);
    
    // 토큰에서 필요한 정보 추출
    const { userId, concertId, queuePosition } = decodedToken;
  
    // get user by queue
    const user = await this.userService.getUserByQueueId(userId)
    
    // get concert by queue
    const concert = await this.concertService.getConcertByQueueId('queueId')
  
    // get queueLength
    const queueLength = await this.queueService.getQueueLenByConcertId(concertId)
    let status = QueueStatusEnum.NOTAVAILABLE
    let token = getQueueStatusDto.token

    if (concert.max_queue > queuePosition){
      status = QueueStatusEnum.AVAILABLE
      //유효시간 5분 승인된 새 토큰 발급 
      token = await this.jwtService.generateToken({...decodedToken, status:QueueStatusEnum.APPROVED}, "10m")
    }

    return {
      userId,
      concertId,
      token: getQueueStatusDto.token,
      position: queuePosition,
      queueLength,
      status:status,
    };
  }
}