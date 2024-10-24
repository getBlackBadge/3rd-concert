import { Global, Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { LoggerContextMiddleware } from './logger-context.middleware';

@Global()
@Module({
  imports: [],
  providers: [Logger],
  exports: [Logger],
})
export class MiddleWareModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerContextMiddleware).forRoutes('*');
  }
}