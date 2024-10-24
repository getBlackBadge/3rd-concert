import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Concert } from '../entities/concert.entity';
import { Seat } from '../entities/seat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from '../entities/reservation.entity';

import { SeatServiceInterface } from './interfaces/seat.service.interface';

@Injectable()
export class SeatService implements SeatServiceInterface {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async getSeatbySeatNumber(seatNumber: number, concertId: string): Promise<Seat> {
    const seat = this.seatRepository.findOne({
      where: { seat_number: seatNumber, concert_id: concertId }
    });
    if (!seat) {
      throw new NotFoundException("해당 번호 좌석을 db테이블에서 찾을 수 없습니다")
    }
    return seat
  }
  // async getSeatReservationById(reservationId: string): Promise<number> {
  //   const seat = await this.seatRepository.findOne({
  //     where: { id: seatId }
  //   });
  // }
  async getPriceById(seatId: string): Promise<number> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId }
    });
    if (!seat) {
      throw new NotFoundException("해당 좌석을 찾을 수 없습니다")
    }
    return seat.price
  }

  async checkSeatStatue(seat: Seat): Promise<boolean> {
    if (seat.status !== 'available') {
      throw new BadRequestException('이미 예약된 좌석입니다.');
    }
    return true
  }

  async checkSeatAvailability(seatNumber: number, concertId: string): Promise<boolean> {
    if (seatNumber < 1 || seatNumber > 50) {
      throw new BadRequestException('좌석 번호는 1에서 50 사이여야 합니다.');
    }
    const existingSeat = await this.seatRepository.findOne({
      where: { seat_number: seatNumber, concert_id: concertId }
    });
    if (existingSeat && existingSeat.status !== 'available') {
      throw new BadRequestException('이미 예약된 좌석입니다.');
    }
    return true
  }

  async getOrCreateSeat(seatNumber: number, concertId: string, status: string = 'reserved_temp'): Promise<Seat> {
    let seat = await this.seatRepository.findOne({
      where: { seat_number: seatNumber, concert_id: concertId }
    });
  
    if (!seat) {
      seat = this.seatRepository.create({
        seat_number: seatNumber,
        concert_id: concertId,
        status: status
      });
      await this.seatRepository.save(seat);
    }
  
    return seat;
  }

  async createSeat(seatNumber: number, concertId: string, status: string): Promise<Seat> {
    const seat = this.seatRepository.save({
      seat_number: seatNumber, 
      concert: concertId,
      status: status
    })
    return seat
  }
  async getSeatsByConcertId(concertId: string): Promise<Seat[]> {
    const allSeats = await this.seatRepository.find({
      where: { concert_id: concertId } 
    });
    return allSeats;
  }
  async formatSeatsForAvailSeats(seats: Seat[], maxSeats: number){
    const availableSeats = Array.from({ length: maxSeats }, (_, i) => i + 1)
    .map(seatNumber => {
      const existingSeat = seats.find(seat => seat.seat_number === seatNumber);
      return {
        seat_number: seatNumber,
        status: existingSeat ? existingSeat.status : 'available',
        updated_at: existingSeat ? existingSeat.updated_at : new Date()
      };
    })
    .filter(seat => seat.status === 'available');
    return availableSeats
  }
}