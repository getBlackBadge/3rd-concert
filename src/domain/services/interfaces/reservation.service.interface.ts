import { Reservation } from '../../entities/reservation.entity';

export interface ReservationServiceInterface {
  getReservationById(reservationId: string): Promise<Reservation>;
  checkReservationAvailability(reservationId: string): Promise<boolean>;
  updateReservation(reservationId: string, updateReservationInfo)
  createReservation(userId, seatId, concertId, price)
}