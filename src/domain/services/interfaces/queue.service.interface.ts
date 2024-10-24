export interface QueueServiceInterface {
  getQueueCountByConcertId(consertId): Promise<number>;
  createQueue(userId, concertId, queueCount, token): Promise<void>;
  updateQueueCount(concertId: string, queueCount: number): Promise<void>;
  getQueueLenByConcertId(concertId): Promise<number>;
}