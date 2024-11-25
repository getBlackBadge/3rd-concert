import { Injectable } from '@nestjs/common';
import { CreateTokenReqDto } from '../../presentation/dto/create-token.controller.dto';
import { QueueStatusResDto, QueueStatusReqDto } from '../../presentation/dto/queue-status.controller.dto';
import { JwtService } from '../../common/jwt/jwt.service';
import { ConcertService } from '../../domain/services/concert.service';
import { UserService } from '../../domain/services/user.service';
import { QueueService } from '../../domain/services/queue.service';
import { QueueStatusEnum } from '../../common/enums/queue-status.enum';
import { RedisRepository } from '../../infrastructure/redis/redis.repository';

@Injectable()
export class QueueFacade {
  constructor(

    private readonly concertService: ConcertService,
    private readonly userService: UserService,
    private readonly queueService: QueueService,
    private jwtService: JwtService,
    private readonly redisRepository: RedisRepository
  ) {}

  async createToken(createTokenDto: CreateTokenReqDto): Promise<string> {
    const { userId, concertId } = createTokenDto;
    // 환경변수로 설정된 값을 가져오고, 기본값을 설정
    const cycle = parseInt(process.env.CYCLE_DURATION_MS || '10000', 10); // 기본값: 10초(10,000ms)
    const maxPerCycle = parseInt(process.env.MAX_PER_CYCLE || '300', 10);  // 기본값: 300명
    
    const concert = await this.concertService.getConcertById(concertId);

    const qCount = await this.redisRepository.incr(`queue:${concertId}:counter`);

    
    const reservationStartTime = concert.reservation_start_time
    const now = new Date();

    // activeAt 시간 계산 (현재 요청이 몇 번째 사이클에 속하는지 결정)
    const activeAt = this.queueService.calculateWaitTime(cycle, maxPerCycle, qCount, reservationStartTime)

    const expireStartTime = activeAt > now ? activeAt : now; 
    const expiresAt = new Date(expireStartTime.getTime() + 5 * 60 * 1000); // activeAt에서 5분 후

    // JWT 토큰 생성
    const tokenPayload = {
      userId: userId,
      concertId: concertId,
      queuePosition: qCount,
      activeAt: activeAt.toISOString(),
      exp: Math.floor(expiresAt.getTime() / 1000),
      status: QueueStatusEnum.NOTAVAILABLE
    };

    const token = this.jwtService.generateToken(tokenPayload, "10m");

    if (!token) {
      throw new Error('Token generation failed');
    }
    return token;
  }

  async getQueueStatus(getQueueStatusDto: QueueStatusReqDto): Promise<QueueStatusResDto> {
    const now = new Date();
    // JWT 토큰 검증 및 디코딩
    const decodedToken = await this.jwtService.verifyToken(getQueueStatusDto.token);
    
    // 토큰에서 필요한 정보 추출
    const { userId, concertId, queuePosition, activeAt } = decodedToken;
  
    // user와 concert가 존재하는지 확인
    await this.userService.getUserById(userId)
    await this.concertService.getConcertById(concertId)
 
    let status = QueueStatusEnum.NOTAVAILABLE
    let token = getQueueStatusDto.token

    if (now > new Date(activeAt)){
      status = QueueStatusEnum.AVAILABLE
      //유효시간 5분 승인된 새 토큰 발급 
      token = await this.jwtService.generateToken({...decodedToken, status}, "5m")
    }

    return {
      userId,
      concertId,
      token: getQueueStatusDto.token,
      position: queuePosition,
      status,
    };
  }
}