import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentReqDto {
  @ApiProperty({
    description: '결제하는 유저의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty({ message: '유저 ID는 필수 입력 항목입니다.' })
  userId: string;

  @ApiProperty({
    description: 'Reservation의 ID',
    example: '987e6543-e21b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty({ message: '예약 ID는 필수 입력 항목입니다.' })
  reservationId: string;
}


export class PaymentResDto {
  @ApiProperty({
    description: '결제 처리 결과 메시지',
    example: '결제가 성공적으로 처리되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '결제 사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: '예약 ID',
    example: '987e6543-e21b-12d3-a456-426614174000',
  })
  reservationId: string;

  @ApiProperty({
    description: '좌석 ID',
    example: '987e6543-e21b-12d3-a456-426614174000',
  })
  seatId: string;

  @ApiProperty({
    description: '결제 금액',
    example: 10000,
  })
  amount: number;

  @ApiProperty({
    description: '결제 상태',
    example: 'SUCCESS',
  })
  status: string; 

  constructor(
    message: string,
    userId: string,
    reservationId: string,
    seatId: string,
    amount: number,
    status: string
  ) {
    this.message = message;
    this.userId = userId;
    this.reservationId = reservationId;
    this.seatId = seatId;
    this.amount = amount;
    this.status = status;
  }
}
