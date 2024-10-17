import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import AppDataSource from './common/config/ormconfig';
// import { redisProvider } from './database/redisconfig';
import { ApiModule } from './api/api.module';
import { ScheduleModule } from '@nestjs/schedule';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    ApiModule,
  ],
  controllers: [],
  providers: [
  ],
  // exports: [redisProvider],
  exports: [],
})
export class AppModule {}

