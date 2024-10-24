import { Concert } from '../../entities/concert.entity';

export interface ConcertServiceInterface {
  verifyConcert(concertId: string): Promise<boolean>;
  getConcertByDate(date: Date): Promise<Concert>;
  getConcertByQueueId(queueId: string): Promise<Concert>
  getConcertById(concertId: string): Promise<Concert>
}
