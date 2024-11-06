import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat } from '../entities/seat.entity';
import { ReservationServiceInterface } from './interfaces/reservation.service.interface';
import { CronJob } from 'cron';
import { SchedulerService } from '../../infrastructure/scheduler/scheduler.service';
import { SeatStatusEnum } from '../../common/enums/seat-status.enum';
import { ReservationStatusEnum } from '../../common/enums/reservation-status.enum';

@Injectable()
export class ReservationService implements ReservationServiceInterface{
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    private schedulerService: SchedulerService
  ) {}
  async getReservationById(reservationId: string): Promise<Reservation> {
    const reservation = this.reservationRepository.findOne({where: {id:reservationId}})
    if (!reservation) {
      throw new NotFoundException('해당 reservation을 찾을 수 없습니다');
    }
    return reservation
  }
  async checkReservationAvailability(reservationId: string): Promise<boolean> {
    const reservation = await this.getReservationById(reservationId)
    if (reservation.status === ReservationStatusEnum.EXPIRED){
      throw new Error('해당 예약은 만료되었습니다');
    }
    if (reservation.payment_deadline < new Date()) {
      throw new Error('해당 예약은 만료되었습니다');
    }
    return true
  }
  async updateReservation(reservationId: string, updateReservationInfo) {
      await this.reservationRepository.update(reservationId, updateReservationInfo);
    }

  async createReservation(
    userId: string, 
    seatId: string, 
    concertId : string, 
    price: number,
    reservationRepository:Repository<Reservation>=this.reservationRepository,
  ) {
    const currentDate = new Date(Date.now())
    const reservation = await reservationRepository.save(
      {
        user_id: userId,
        seat_id: seatId,
        concert_id: concertId,
        status: ReservationStatusEnum.PENDING,
        amount: price, // 좌석의 가격 사용
        payment_deadline: new Date(Date.now() + 5 * 60 * 1000), // 현재 시간으로부터 5분 후
        reserved_at: currentDate, // 예약 시간 추가
        created_at: currentDate,
        updated_at: currentDate
      }
    )
    return reservation
  }

  
    /**
   * 예약 만료 처리를 위한 스케줄링
   * @param reservationId 예약 ID
   * @param paymentDeadline 결제 기한
   */
    scheduleReservationExpiration(reservationId: string, paymentDeadline: Date): void {
      const jobName = `reservation-expiration-${reservationId}`;
  
      // 현재 시간과 결제 기한의 차이 계산
      const now = new Date();
      const timeDifference = paymentDeadline.getTime() - now.getTime();
  
      if (timeDifference <= 0) {
        console.log(`예약 ID ${reservationId}는 이미 결제 기한이 지났습니다.`);
        this.expireReservation(reservationId); // 이미 기한이 지났다면 바로 만료 처리
        return;
      }
  
      // 결제 기한에 예약을 만료 처리하는 작업을 스케줄링
      const job = new CronJob(new Date(paymentDeadline), () => {
        console.log(`예약 ID ${reservationId} 만료 처리`);
        this.expireReservation(reservationId);
        this.schedulerService.deleteCronJob(jobName); // 작업 완료 후 스케줄러에서 제거
      });
  
      // 스케줄러에 작업 추가
      this.schedulerService.addCronJob(jobName, job);
      job.start();
      console.log(`예약 ID ${reservationId}의 만료 처리가 ${paymentDeadline}에 스케줄링되었습니다.`);
    }
  
    /**
     * 예약을 만료 처리하는 메서드
     * @param reservationId 예약 ID
     */
    private expireReservation(reservationId: string): void {
      // 예약 만료 처리 로직 (데이터베이스 업데이트, 알림 발송 등)
      console.log(`예약 ID ${reservationId}가 만료되었습니다.`);
      // 실제 비즈니스 로직을 여기에 구현 (예: DB 상태 업데이트)
      // 예약 정보 조회 및 업데이트
      this.reservationRepository.findOne({ where: { id: reservationId } })
      .then(reservation => {
        if (reservation) {
          // 예약 상태를 'expired'로 변경
          reservation.status = ReservationStatusEnum.EXPIRED;
          return this.reservationRepository.save(reservation).then(() => reservation); // reservation을 반환
        }
      })
      .then(reservation => {
        if (reservation && reservation.seat_id) {
          // Update the seat status to 'available' where the reservation ID matches
          return this.seatRepository.update(
            { id: reservation.seat_id }, // 좌석 ID를 사용하여 업데이트
            { status: SeatStatusEnum.AVAILABLE }
          );
        }
      })
      .catch(error => {
        console.error(`예약 ID ${reservationId} 만료 처리 중 오류 발생:`, error);
      });
    }
}