import { Module } from '@nestjs/common';
import { BalanceFacade } from './facades/balance.facade';
import { PaymentFacade } from './facades/payment.facade';
import { QueueFacade } from './facades/queue.facade';
import { ReservationFacade } from './facades/reservation.facade';
import { JwtModule } from '../common/jwt/jwt.module';
import { DomainModule } from '../domain/domain.module';

@Module({
  imports: [DomainModule, JwtModule],
  controllers: [],
  providers: [
    BalanceFacade,
    PaymentFacade,
    QueueFacade,
    ReservationFacade,
  ],
  exports: [
    BalanceFacade,
    PaymentFacade,
    QueueFacade,
    ReservationFacade,
  ],
})
export class FacadeModule {}