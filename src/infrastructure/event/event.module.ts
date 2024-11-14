import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IEventEmitterClient } from './event.interface';
import { NestEventEmitterClient } from './event-emitter.client';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],
  providers: [
    {
      provide: IEventEmitterClient,
      useClass: NestEventEmitterClient,
    },
  ],
  exports: [IEventEmitterClient],
})
export class EventModule {}
