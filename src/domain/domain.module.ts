import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from './entities/concert.entity';
import { Reservation } from './entities/reservation.entity';
import { Seat } from './entities/seat.entity';
import { User } from './entities/user.entity';
import { BalanceService } from './services/balance.service';
import { QueueService } from './services/queue.service';
import { ConcertService } from './services/concert.service';
import { UserService } from './services/user.service';
import { SeatService } from './services/seat.service';
import { ReservationService } from './services/reservation.service';
import { JwtModule } from '../common/jwt/jwt.module';
import { SchedulerModule } from '../infrastructure/scheduler/scheduler.module';
import { EventListenerService } from './services/event-listener.service';
import { EventEmitterService } from './services/event-emitter.service';
import { EventModule } from 'src/infrastructure/event/event.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, Reservation, Seat, User]),
    JwtModule,
    SchedulerModule,
    EventModule
  ],
  providers: [
      BalanceService, 
      QueueService, 
      ConcertService, 
      UserService, 
      SeatService, 
      ReservationService,
      EventListenerService,
      EventEmitterService
  ],
  exports: [
    TypeOrmModule,
    JwtModule,
    BalanceService,
    QueueService,
    ConcertService,
    UserService,
    SeatService,
    ReservationService,
    EventEmitterService
  ],
})
export class DomainModule {}
