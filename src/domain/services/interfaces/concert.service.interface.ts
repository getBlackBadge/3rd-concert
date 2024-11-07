import { Concert } from '../../entities/concert.entity';

export interface ConcertServiceInterface {
  verifyConcert(concertId: string): Promise<boolean>;
  getConcertByDate(date: Date): Promise<Concert>;
  getConcertById(concertId: string): Promise<Concert>
}
