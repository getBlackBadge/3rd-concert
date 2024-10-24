import { Seat } from '../../entities/seat.entity';

export interface SeatServiceInterface {
  getSeatbySeatNumber(seatNumber: number, concertId: string): Promise<Seat>;
  // getSeatReservationById(reservationId: string): Promise<number>;
  getPriceById(seatId: string): Promise<number>;
  checkSeatAvailability(seatNumber: number, concertId: string): Promise<boolean>
  // seatValidityCheck(Token: string): Promise<number>;
  createSeat(seatNumber: number, concertId: string, status: string): Promise<Seat>;
  getSeatsByConcertId(concertId: string): Promise<Seat[]>;
  formatSeatsForAvailSeats(seats: Seat[], maxSeats: number)
}