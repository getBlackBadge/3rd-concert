import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventEmitterClient } from './event.interface';

@Injectable()
export class NestEventEmitterClient implements IEventEmitterClient {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: string, payload: any): void {
    this.eventEmitter.emit(event, payload);
  }
}
