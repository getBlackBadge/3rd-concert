import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import AppDataSource from './common/config/orm.config';
// import { redisProvider } from './database/redisconfig';
import { PresentationModule } from './presentation/presentation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MiddleWareModule } from './common/middleware/middleware.module';
import { ExceptionsFilter } from './common/filters/exception.filter';
import { LoggingInterceptor } from './common/interceptors/http.interceptor';
import { EventModule } from './infrastructure/event/event.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaController } from './kafka/kafka.controller';
import { KafkaService } from './kafka/kafka.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    MiddleWareModule,
    PresentationModule,
    EventModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['kafka-0:9092'],
          },
          consumer: {
            groupId: 'my-consumer-group', // 고유한 그룹 ID 설정
          },
        },
      },
  ],)],
  controllers: [KafkaController],
  providers: [
    { provide: APP_FILTER, useClass: ExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    KafkaService
  ],
  // exports: [redisProvider],
  exports: [],
})
export class AppModule {}

