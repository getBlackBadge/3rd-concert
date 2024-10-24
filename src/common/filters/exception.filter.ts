// common/filters/exception.filter.ts
import { Catch, ArgumentsHost, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { UserNotFoundException } from '../exceptions';
import { ConcertNotFoundException } from '../exceptions';
import { SeatNotAvailableException } from '../exceptions';
import { InvalidTokenException } from '../exceptions';

@Catch()
export class ExceptionsFilter {
  private readonly logger: Logger = new Logger(ExceptionsFilter.name);
  
  constructor() {
    this.logger.log('ExceptionsFilter가 초기화되었습니다');
  }
  public catch(exception: unknown, host: ArgumentsHost): void {
    let args: unknown;
    let message: string = 'UNKNOWN ERROR';

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const statusCode = this.getHttpStatus(exception);
    const datetime = new Date();

    if (exception instanceof UserNotFoundException) {
      message = '사용자를 찾을 수 없습니다';
    } else if (exception instanceof ConcertNotFoundException) {
      message = '콘서트를 찾을 수 없습니다';
    } else if (exception instanceof SeatNotAvailableException) {
      message = '좌석이 사용 불가능합니다';
    } else if (exception instanceof InvalidTokenException) {
      message = '토큰이 유효하지 않습니다';
    } else {
      message = exception instanceof HttpException ? exception.message : message;
    }

    const errorResponse = {
      code: statusCode,
      timestamp: datetime,
      path: req.url,
      method: req.method,
      message: message,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: errorResponse, args: { req, res } });
    } else {
      this.logger.warn({ err: errorResponse, args });
    }

    res.status(statusCode).json(errorResponse);
  }

  private getHttpStatus(exception: unknown): HttpStatus {
    if (
      exception instanceof QueryFailedError 
    ) {
      return HttpStatus.CONFLICT;
    } else if (exception instanceof HttpException) return exception.getStatus();
    else return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}