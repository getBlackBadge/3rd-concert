import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservationReqDto, ReservationResDto } from '../../api/dto/reservation.dto';
import { DataSource, Repository } from 'typeorm';
import { Concert } from '../../domain/entities/concert.entity';
import { Seat } from '../../domain/entities/seat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from '../../domain/entities/reservation.entity';
import { AvailableSeatsResDto } from '../../api/dto/reservation.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Concert)
    private readonly concertRepository: Repository<Concert>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private schedulerRegistry: SchedulerRegistry
  ) {}
  /**
   * 좌석 예약 요청 처리
   * @param reservationDto 좌석 예약 정보
   * @returns 예약 처리 결과
   */
  async reserveSeat(reservationDto: ReservationReqDto): Promise<ReservationResDto> {
    const { seatNumber, userId, concertId } = reservationDto;

    // 좌석 번호 유효성 검사 (1~50)
    if (seatNumber < 1 || seatNumber > 50) {
      throw new BadRequestException('좌석 번호는 1에서 50 사이여야 합니다.');
    }

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 콘서트 존재 여부 확인
      const concert = await queryRunner.manager.findOne(Concert, { where: { id: concertId } });
      if (!concert) {
        throw new NotFoundException('해당 콘서트를 찾을 수 없습니다.');
      }

      // 좌석 중복 예약 확인
      const existingSeat = await queryRunner.manager.findOne(Seat, {
        where: { seat_number: seatNumber, concert: { id: concertId } }
      });
      if (existingSeat && existingSeat.status !== 'available') {
        throw new BadRequestException('이미 예약된 좌석입니다.');
      }

      // 좌석 생성 또는 업데이트
      // 좌석은 이미 concertid와 같이 unique조건이 걸려있다.
      let seat = existingSeat;
      if (!seat) {
        seat = await queryRunner.manager.save(Seat, { 
          seat_number: seatNumber, 
          concert: { id: concertId },
          status: 'available'
        });
      }

      // https://chrisjune-13837.medium.com/db-postgresql-lock-%ED%8C%8C%ED%97%A4%EC%B9%98%EA%B8%B0-57d37ebe057
      // 해당 seat row에 대해 Lock을 걸고 다시 조회
      seat = await queryRunner.manager.findOne(Seat, {
        where: { id: seat.id },
        lock: { mode: 'pessimistic_write' }
      });

      if (seat.status !== 'available') {
        throw new BadRequestException('이미 예약된 좌석입니다.');
      }

      seat.status = 'reserved_temp';
      await queryRunner.manager.save(seat);

      // 예약 정보 생성
      const reservation = await queryRunner.manager.save(Reservation, {
        user: { id: userId },
        seat: seat,
        concert: { id: concertId },
        status: 'pending',
        amount: seat.price, // 좌석의 가격 사용
        payment_deadline: new Date(Date.now() + 5 * 60 * 1000), // 현재 시간으로부터 5분 후
        reserved_at: new Date(), // 예약 시간 추가
        created_at: new Date(),
        updated_at: new Date()
      });

      // 좌석 상태 업데이트
      seat.status = 'reserved';
      seat.updated_at = new Date();
      await queryRunner.manager.save(seat);
      // 예약 만료 처리를 위한 스케줄링
      this.scheduleReservationExpiration(reservation.id, reservation.payment_deadline);
      // 예약 ID 반환
      return {
        message: `좌석 ${seatNumber}이(가) 임시 예약되었습니다.`,
        reservationId: reservation.id
      };

    } catch (error) {
      // 에러 발생 시 롤백
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('좌석 예약 중 오류가 발생했습니다.');
    } finally {
      // 4. Lock 해제 (트랜잭션 종료 시 자동으로 해제됨)
      await queryRunner.release();
    }
  }

  /**
   * 특정 날짜의 예약 가능한 좌석 정보 조회
   * @param date 예약 날짜
   * @returns 예약 가능한 좌석 번호 목록
   */
  async getAvailableSeats(date: string): Promise<AvailableSeatsResDto> {
    // 데이터베이스에서 콘서트 정보 조회
    const concertDate = new Date(date);
    const concert = await this.concertRepository.findOne({ where: { concert_date: concertDate } });
    if (!concert) {
      throw new NotFoundException('해당 날짜의 콘서트를 찾을 수 없습니다.');
    }

    // 콘서트의 최대 좌석 수 확인
    const maxSeats = concert.max_seats;

    // 데이터베이스에서 모든 좌석 정보 조회
    const allSeats = await this.seatRepository.find({
      where: { concert: { id: concert.id } }
    });

    // 예약 가능한 좌석 계산 및 매핑
    const availableSeats = Array.from({ length: maxSeats }, (_, i) => i + 1)
      .map(seatNumber => {
        const existingSeat = allSeats.find(seat => seat.seat_number === seatNumber);
        return {
          seat_number: seatNumber,
          status: existingSeat ? existingSeat.status : 'available',
          updated_at: existingSeat ? existingSeat.updated_at : new Date()
        };
      })
      .filter(seat => seat.status === 'available');

    return {
      date,
      concertId: concert.id,
      availableSeats
    };
  }

  /**
   * 예약 만료 처리를 위한 스케줄링
   * @param reservationId 예약 ID
   * @param paymentDeadline 결제 기한
   */
  private scheduleReservationExpiration(reservationId: string, paymentDeadline: Date): void {
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
      this.schedulerRegistry.deleteCronJob(jobName); // 작업 완료 후 스케줄러에서 제거
    });

    // 스케줄러에 작업 추가
    this.schedulerRegistry.addCronJob(jobName, job);
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
        reservation.status = 'expired';
        return this.reservationRepository.save(reservation).then(() => reservation); // reservation을 반환
      }
    })
    .then(reservation => {
      if (reservation && reservation.seat) {
        // Update the seat status to 'available' where the reservation ID matches
        return this.seatRepository.update(
          { id: reservation.seat.id }, // 좌석 ID를 사용하여 업데이트
          { status: 'available' }
        );
      }
    })
    .catch(error => {
      console.error(`예약 ID ${reservationId} 만료 처리 중 오류 발생:`, error);
    });
  }
}