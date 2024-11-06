import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 좌석 예약 요청 DTO
 */
export class ReservationResDto {
  message: string;
  reservationId: string;

  constructor(message: string, reservationId: string) {
    this.message = message;
    this.reservationId = reservationId;
  }
}

export class ReservationReqDto {
  @ApiProperty({ 
    description: '예약할 좌석 번호 (1 ~ 50)', 
    minimum: 1, 
    maximum: 50,
    example: 15
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(50)
  seatNumber: number;

  @ApiProperty({ 
    description: '사용자 식별자', 
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: '콘서트 식별자', 
    format: 'uuid',
    example: '987e6543-e21b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  concertId: string;

  @ApiProperty({ 
    description: '대기열 JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6I...'
  })
  @IsString()
  token: string;
}

export class AvailableSeatsResDto {
  @ApiProperty({ 
    description: '날짜', 
    example: '2023-04-15' 
  })
  date: string;

  @ApiProperty({ 
    description: '콘서트 식별자', 
    format: 'uuid',
    example: '987e6543-e21b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  concertId: string;

  @ApiProperty({
    description: '사용 가능한 좌석 목록',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        seat_number: { type: 'number', description: '좌석 번호', example: 10 },
        status: { type: 'string', description: '좌석 상태', example: 'available' },
        updated_at: { type: 'string', format: 'date-time', description: '최종 업데이트 시간', example: '2023-04-15T14:30:00Z' }
      }
    },
    example: [
      { seat_number: 10, status: 'available', updated_at: '2023-04-15T14:30:00Z' },
      { seat_number: 11, status: 'reserved', updated_at: '2023-04-15T15:00:00Z' }
    ]
  })
  availableSeats: {
    seat_number: number;
    status: string;
    updated_at: Date;
  }[];

  constructor(date: string, concertId: string, availableSeats: { seat_number: number; status: string; updated_at: Date; }[]) {
    this.date = date;
    this.concertId = concertId;
    this.availableSeats = availableSeats;
  }
}