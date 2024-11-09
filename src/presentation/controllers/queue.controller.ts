import { Controller, Post, Body, Get, Param, HttpStatus, HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
import { QueueFacade } from '../../application/facades/queue.facade';
import { CreateTokenReqDto, CreateTokenResDto } from '../dto/create-token.dto';
import { QueueStatusResDto, QueueStatusRequestDto } from '../dto/queue-status.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueFacade: QueueFacade) {}

  /**
   * 유저 대기열 토큰 발급 API
   * UUID와 대기열 정보를 포함한 토큰을 생성합니다.
   * @param createTokenDto 유저 대기열 토큰 생성 정보
   */
  @Post('token')
  @UsePipes(new ValidationPipe())
  async createToken(@Body() createTokenDto: CreateTokenReqDto): Promise<CreateTokenResDto> {
    try {
      const token = await this.queueFacade.createToken(createTokenDto);
      return new CreateTokenResDto(token);
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
  async getQueueStatus(@Body() queueStatusRequestDto: QueueStatusRequestDto): Promise<QueueStatusResDto>{
    try {
      const { token, userId, concertId, position, status } = await this.queueFacade.getQueueStatus(queueStatusRequestDto);
      return new QueueStatusResDto(token, userId, concertId, position, status);
    } catch (error) {
      throw new HttpException('대기열 상태 조회에 실패했습니다.', HttpStatus.BAD_REQUEST);
    }
  }
}