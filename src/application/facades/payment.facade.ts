import { Injectable } from '@nestjs/common';
import { BalanceService } from '../../domain/services/balance.service';
import { ReservationService } from '../../domain/services/reservation.service';
import { SeatService } from '../../domain/services/seat.service';
import { PaymentReqDto } from '../../presentation/dto/payment.dto'
import { RedisLockManager } from '../../common/managers/locks/redis-wait-lock.manager';
import { ReservationStatusEnum } from '../../common/enums/reservation-status.enum';
import { PaymentStatusEnum } from '../../common/enums/payment-status.enum';

@Injectable()
export class PaymentFacade {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly reservationService: ReservationService,
    private readonly seatService: SeatService,
    private readonly redisLockManager: RedisLockManager

  ) {}

  /**
   * 결제 처리
   * 사용자가 선택한 좌석에 대해 결제를 처리하고, 성공 시 좌석 소유권을 사용자에게 배정합니다.
   * @param paymentDto - 결제 관련 정보 (유저 ID, 좌석 ID, 결제 금액 등)
   * @returns 결제 성공 여부와 결제 정보
   * @throws BadRequestException - 결제 실패 시 예외 발생
   */
  async processPayment(paymentDto: PaymentReqDto) {
    const reservationId = paymentDto.reservationId 
    const userId = paymentDto.userId

    // reservation 만료 검사
    this.reservationService.checkReservationAvailability(reservationId)

    const reservation = await this.reservationService.getReservationById(reservationId)
    const price = await this.seatService.getPriceById(reservation.seat_id)
    await this.redisLockManager.withLockBySrc(userId, "user", async ()=>{
      await this.balanceService.decreaseBalance(userId, price)
    })
    await this.reservationService.updateReservation(reservationId, 
      {
        "status": ReservationStatusEnum.COMPLETED,
        "completed_at": new Date(),
      }
    )

    // 6. 결제 완료 정보 반환
    return {
      userId,
      reservationId,
      seatId: reservation.seat_id,
      amount: reservation.amount,
      status: PaymentStatusEnum.SUCCESS,
      message: '결제가 성공적으로 처리되었습니다.',
    };
}
}
