import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from './entities/concert.entity';
import { Queue } from './entities/queue.entity';
import { Reservation } from './entities/reservation.entity';
import { Seat } from './entities/seat.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, Queue, Reservation, Seat, User])
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class DomainModule {}