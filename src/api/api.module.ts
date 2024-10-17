import { Module } from '@nestjs/common';
import { BalanceController } from './controllers/balance.controller';
// import { PaymentController } from './controllers/payment.controller';
import { QueueController } from './controllers/queue.controller';
import { ReservationController } from './controllers/reservation.controller';
import { ApplicationModule } from 'src/application/application.module';

@Module({
  imports: [ApplicationModule],
  controllers: [
    BalanceController,
    // PaymentController,
    QueueController,
    ReservationController,
  ],
  providers: [],
})
export class ApiModule {}