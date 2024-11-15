import { Injectable } from '@nestjs/common';


import { IEventEmitterClient } from 'src/infrastructure/event/event.interface'; 

@Injectable()
export class EventEmitterService {
  constructor(
    private readonly eventEmitterClient: IEventEmitterClient
  ) {}
  

  sendDataPlatform(): void{
    this.eventEmitterClient.emit("created", "sendDataPlatform")
  }

  sendOrderInfo(): void{
    this.eventEmitterClient.emit("created", "sendOrderInfo")
  }

  issueCashReceipt(): void{
    this.eventEmitterClient.emit("created", "issueCashReceipt")
  }


}