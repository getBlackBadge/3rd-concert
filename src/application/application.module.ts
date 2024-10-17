import { Module } from '@nestjs/common';
import { BalanceService } from './services/balance.service';
import { PaymentService } from './services/payment.service';
import { QueueService } from './services/queue.service';
import { ReservationService } from './services/reservation.service';
import { DomainModule } from 'src/domain/domain.module';
import { JwtModule } from 'src/common/jwt/jwt.module';

@Module({
  imports: [DomainModule, JwtModule],

  controllers: [],
  providers: [
    BalanceService,
    PaymentService,
    QueueService,
    ReservationService,
  ],
  exports: [
    BalanceService,
    PaymentService,
    QueueService,
    ReservationService,
  ],
})
export class ApplicationModule {}