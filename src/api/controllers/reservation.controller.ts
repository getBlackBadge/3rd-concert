import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { ReservationService } from '../../application/services/reservation.service';
import { ReservationReqDto, ReservationResDto } from '../dto/reservation.dto';
import { AvailableSeatsResDto } from '../../api/dto/reservation.dto';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  /**
   * 좌석 예약 요청 API
   * @param reservationDto 좌석 예약 정보
   * @returns 예약 처리 결과
   */
  @Post()
  @UsePipes(ValidationPipe)
  async reserveSeat(@Body() reservationDto: ReservationReqDto): Promise<ReservationResDto> {
    const result = await this.reservationService.reserveSeat(reservationDto);
    return result;
  }

  /**
   * 특정 날짜의 예약 가능한 좌석 정보를 조회하는 API
   * @param date 예약 날짜
   * @returns 예약 가능한 좌석 정보
   */
  @Get(':date')
  @UsePipes(ValidationPipe)
  // concert는 따로 명시된 게 없으므로 1개만 있다고 가정하고 date를 기준을 쿼리를 날립니다
  async getAvailableSeats(@Param('date') date: string): Promise<AvailableSeatsResDto>  {
    return await this.reservationService.getAvailableSeats(date);
  }
}
