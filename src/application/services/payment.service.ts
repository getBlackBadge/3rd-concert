import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentDto } from '../../api/dto/payment.dto';
import { BalanceService } from './balance.service';
import { Repository } from 'typeorm';
import { Reservation } from '../../domain/entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,  
    private readonly balanceService: BalanceService,
  ) {}

  /**
   * 결제 처리
   * 사용자가 선택한 좌석에 대해 결제를 처리하고, 성공 시 좌석 소유권을 사용자에게 배정합니다.
   * @param paymentDto - 결제 관련 정보 (유저 ID, 좌석 ID, 결제 금액 등)
   * @returns 결제 성공 여부와 결제 정보
   * @throws BadRequestException - 결제 실패 시 예외 발생₩
   */
  async processPayment(paymentDto: PaymentDto) {
    const { userId, reservationId} = paymentDto;

    // 1. 예약 정보 조회
  const reservation = await this.reservationRepository.findOne({
    where: { id: reservationId, user: { id: userId } },
    relations: ['user', 'seat', 'concert'],
  });

  if (!reservation) {
    throw new NotFoundException('예약 정보를 찾을 수 없습니다.');
  }

  // 2. 사용자 잔액 확인
  const balance = await this.balanceService.getBalance(userId);
  if (balance < reservation.amount) {
    throw new BadRequestException('잔액이 부족합니다.');
  }

  // 3. 예약 상태 확인
  if (reservation.status !== 'pending') {
    throw new BadRequestException('유효한 예약 상태가 아닙니다.');
  }

  // 4. 결제 처리
  // 이 동작은 같은 유저라면 락이 걸려 순차적으로 처리하게 설계되었습니다.
  await this.balanceService.decreaseBalance(userId, reservation.amount);

  // 5. 예약 상태 업데이트
  reservation.status = 'completed';
  reservation.completed_at = new Date();
  await this.reservationRepository.save(reservation);

  // 6. 결제 완료 정보 반환
  return {
    userId,
    reservationId,
    seatId: reservation.seat.id,
    amount: reservation.amount,
    status: 'success',
    message: '결제가 성공적으로 처리되었습니다.',
  };
}
}
