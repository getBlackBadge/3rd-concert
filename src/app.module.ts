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

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    MiddleWareModule,
    PresentationModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: ExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  // exports: [redisProvider],
  exports: [],
})
export class AppModule {}

