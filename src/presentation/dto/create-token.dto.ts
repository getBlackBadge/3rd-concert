import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  /**
   * 유저 ID
   * 대기열 토큰을 발급받을 유저의 고유 식별자입니다.
   */
  @ApiProperty({
    description: '대기열 토큰을 발급받을 유저의 고유 식별자',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty({ message: '유저 ID는 필수입니다.' })
  userId: string;

  @ApiProperty({
    description: '대기열 토큰을 발급받을 콘서트의 고유 식별자',
    example: '987e6543-e21b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty({ message: '콘서트 ID는 필수입니다.' })
  concertId: string;
}