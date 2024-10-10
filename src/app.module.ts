import { Module, Global } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import AppDataSource from './database/ormconfig';
// import { redisProvider } from './database/redisconfig';

@Global()
@Module({
  imports: [
    // TypeOrmModule.forRoot(AppDataSource.options),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // redisProvider,
  ],
  // exports: [redisProvider],
  exports: [],
})
export class AppModule {}