import { Inject, Injectable, Logger, LoggerService, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerContextMiddleware implements NestMiddleware {
  constructor(
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl, headers } = req;
    const userAgent = req.get('user-agent');
    
    const datetime = new Date();
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(
        `요청 처리 완료: ${datetime} ${method} ${originalUrl} ${statusCode} ${__filename}`,
      );
    });

    next();
  }
}