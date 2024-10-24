import { BadRequestException, Injectable } from '@nestjs/common';
import { ReservationReqDto, ReservationResDto, AvailableSeatsResDto } from '../../presentation/dto/reservation.dto';
import { SeatService } from '../../domain/services/seat.service';
import { ReservationService } from '../../domain/services/reservation.service';
import { ConcertService } from '../../domain/services/concert.service';
import { DataSource, Repository } from 'typeorm';
import { Reservation } from '../../domain/entities/reservation.entity';
import { Seat } from '../../domain/entities/seat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '../../common/jwt/jwt.service';


@Injectable()
export class ReservationFacade {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,

    private readonly dataSource: DataSource,

    private readonly seatService: SeatService,
    private readonly reservationService: ReservationService,
    private readonly concertService: ConcertService,
    private readonly jwtService: JwtService
  ) {}
  /**
   * 좌석 예약 요청 처리
   * @param reservationDto 좌석 예약 정보
   * @returns 예약 처리 결과
   */
  async reserveSeat(reservationDto: ReservationReqDto): Promise<ReservationResDto> {
    const { seatNumber, userId, concertId, token } = reservationDto;

    // token 검사
    const decodedToken = await this.jwtService.verifyToken(token)
    if (decodedToken.status !== "approved") {
      throw new BadRequestException("토큰이 유효하지 않습니다")
    }

    // add maxqueue

    // verifytoken
    this.concertService.verifyConcert(concertId)
    this.seatService.checkSeatAvailability(seatNumber, concertId)

    const targetSeat= await this.seatService.getOrCreateSeat(seatNumber, concertId)

    // withlock
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      console.log('트랜잭션 시작');
      console.log(`seat ID ${targetSeat.id}에 대한 락 획득 시도`);

      let seatRepository = transactionalEntityManager.withRepository(this.seatRepository);
      let reservationRepository = transactionalEntityManager.withRepository(this.reservationRepository);

      const seat = await seatRepository.findOne({
          where: { id: targetSeat.id },
          lock: { mode: 'pessimistic_write' },
      });
      this.seatService.checkSeatStatue(seat)
      const reservation = await this.reservationService.createReservation(userId, seat.id, concertId, seat.price, reservationRepository)
      this.reservationService.scheduleReservationExpiration(reservation.id, reservation.payment_deadline)

      // 예약 만료 처리를 위한 스케줄링
      return {
          message: `좌석 ${seatNumber}이(가) 임시 예약되었습니다.`,
          reservationId: reservation.id
        };
      }
      )

  }

  /**
   * 특정 날짜의 예약 가능한 좌석 정보 조회
   * @param date 예약 날짜
   * @returns 예약 가능한 좌석 번호 목록
   */
  async getAvailableSeats(date: string): Promise<AvailableSeatsResDto> {
    // 데이터베이스에서 콘서트 정보 조회
    const concertDate = new Date(date);
    
    const concert = await this.concertService.getConcertByDate(concertDate)

    const maxSeats = concert.max_seats

    let seats = await this.seatService.getSeatsByConcertId(concert.id)

    const availableSeats = await this.seatService.formatSeatsForAvailSeats(seats, maxSeats)
    return {
      date,
      concertId: concert.id,
      availableSeats
    };

  }
}