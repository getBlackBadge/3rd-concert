
// kafka.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  // 메시지 발행 API
  @Post('publish')
  async publishMessage(@Body('message') message: string) {
    await this.kafkaService.sendMessage(message);
    return { status: 'Message sent', message };
  }

  // 메시지 소비 이벤트 핸들러
  @MessagePattern('my-topic')
  handleMessage(@Payload() message: any) {
    console.log('Received message:', message.value);
    console.log('Received message:', message.value);
    return message.value;
  }
}
