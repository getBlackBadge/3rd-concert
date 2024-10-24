import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from './entities/concert.entity';
import { Queue } from './entities/queue.entity';
import { Reservation } from './entities/reservation.entity';
import { Seat } from './entities/seat.entity';
import { User } from './entities/user.entity';
import { BalanceService } from './services/balance.service';
import { QueueService } from './services/queue.service';
import { ConcertService } from './services/concert.service';
import { UserService } from './services/user.service';
import { SeatService } from './services/seat.service';
import { ReservationService } from './services/reservation.service';
// import { BalanceServiceInterface } from './services/interfaces/balance.service.interface';
// import { PaymentServiceInterface } from './services/interfaces/payment.service.interface';
// import { QueueServiceInterface } from './services/interfaces/queue.service.interface';
// import { ConcertServiceInterface } from './services/interfaces/concert.service.interface';
// import { UserServiceInterface } from './services/interfaces/user.service.interface';
// import { SeatServiceInterface } from './services/interfaces/seat.service.interface';
// import { ReservationServiceInterface } from './services/interfaces/reservation.service.interface';

import { JwtModule } from '../common/jwt/jwt.module';
import { SchedulerModule } from '../infrastructure/scheduler/scheduler.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, Queue, Reservation, Seat, User]),
    JwtModule,
    SchedulerModule
  ],
  providers: [
      BalanceService, 
      QueueService, 
      ConcertService, 
      UserService, 
      SeatService, 
      ReservationService, 
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
  ],
})
export class DomainModule {}
