import { Injectable } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
import { OnEventSafe } from '../../infrastructure/event/on-event-safe.decorator'
@Injectable()
export class EventListenerService {
  @OnEventSafe('created')
  mockedHandleEvent(payload: any) {
    console.log('NEW EVENT was created:', payload);
  }
}
