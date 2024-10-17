import { Controller, Post, Body, Get, Param, HttpStatus, HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
import { QueueService } from '../../application/services/queue.service';
import { CreateTokenDto } from '../dto/create-token.dto';
import { QueueStatusResDto, QueueStatusRequestDto } from '../dto/queue-status.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * 유저 대기열 토큰 발급 API
   * UUID와 대기열 정보를 포함한 토큰을 생성합니다.
   * @param createTokenDto 유저 대기열 토큰 생성 정보
   */
  @Post('token')
  @UsePipes(new ValidationPipe())
  async createToken(@Body() createTokenDto: CreateTokenDto) {
    try {
      const token = await this.queueService.createToken(createTokenDto);
      return { token };
    } catch (error) {
      throw new HttpException('토큰 생성에 실패했습니다.', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 대기열 상태 조회 API
   * 특정 유저의 대기 상태를 조회합니다.
   * 폴링 방식으로 대기번호를 확인할 수 있습니다.
   */
  @Post('status')
  @UsePipes(new ValidationPipe())
  async getQueueStatus(@Body() queueStatusRequestDto: QueueStatusRequestDto) {
    try {
      const queueStatus: QueueStatusResDto = await this.queueService.getQueueStatus(queueStatusRequestDto);
      return queueStatus;
    } catch (error) {
      throw new HttpException('대기열 상태 조회에 실패했습니다.', HttpStatus.BAD_REQUEST);
    }
  }
}