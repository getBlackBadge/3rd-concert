import { IsString, IsNotEmpty, IsUUID  } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueueStatusRequestDto {
  @ApiProperty({ 
    description: '대기열 JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6I...'
  })
  @IsString()
  @IsNotEmpty({ message: '대기열 JWT는 필수입니다.' })
  token: string;
}

export class QueueStatusResDto {
  /**
   * 유저 대기열 토큰
   * 대기열 상태를 조회할 때 사용하는 고유한 토큰입니다.
   */
  @ApiProperty({ 
    description: '대기열 JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6I...'
  })
  @IsString()
  token: string;

  @ApiProperty({ 
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: '콘서트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  concertId: string;

  @ApiProperty({ 
    description: '대기열에서의 현재 위치',
    example: 42
  })
  position: number;
  
  @ApiProperty({ 
    description: '전체 대기열 길이',
    example: 1000
  })
  queueLength: number;

  @ApiProperty({ 
    description: '상태',
    example: 'available / notAvailable'
  })
  @IsString()
  status: string;

  constructor(
    token: string,
    userId: string,
    concertId: string,
    position: number,
    queueLength: number,
    status: string
  ) {
    this.token = token;
    this.userId = userId;
    this.concertId = concertId;
    this.position = position;
    this.queueLength = queueLength;
    this.status = status;
  }
}