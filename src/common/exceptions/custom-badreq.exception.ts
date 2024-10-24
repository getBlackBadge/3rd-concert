import { BadRequestException } from '@nestjs/common';

export class UserNotFoundException extends BadRequestException {
  constructor() {
    super('User not found');
  }
}

export class ConcertNotFoundException extends BadRequestException {
  constructor() {
    super('Concert not found');
  }
}

export class SeatNotAvailableException extends BadRequestException {
  constructor() {
    super('Seat is not available');
  }
}

export class InvalidTokenException extends BadRequestException {
  constructor() {
    super('Token is not valid');
  }
}
