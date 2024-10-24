import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
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