import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BalanceReqDto {
  /**
   * 사용자 식별자 (UUID 형식)
   */
  @ApiProperty({
    description: '사용자 식별자 (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  /**
   * 충전할 금액 (최소 1 이상의 값)
   */
  @ApiProperty({
    description: '충전할 금액 (최소 1 이상의 값)',
    minimum: 1,
    example: 1000
  })
  @IsNumber()
  @Min(1, { message: '충전 금액은 1 이상이어야 합니다.' })
  amount: number;
}

export class ChargeBalanceResDto {
  @ApiProperty({
    description: '충전 결과 메시지',
    example: 'Balance가 성공적으로 충전되었습니다.',
  })
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class GetBalanceResDto {
  @ApiProperty({
    description: '현재 잔액',
    example: 15000,
  })
  balance: number;

  constructor(balance: number) {
    this.balance = balance;
  }
}