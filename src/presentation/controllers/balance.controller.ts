import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
// import { BalanceService } from '../../domain/services/deprecated/balance.service';
import { BalanceReqDto, ChargeBalanceResDto, GetBalanceResDto } from '../dto/balance.dto';
import { BalanceFacade } from '../../application/facades/balance.facade'

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceFacade: BalanceFacade) {}

  /**
   * 잔액 충전 API
   * @param userId - 사용자 식별자
   * @param balanceDto - 충전할 금액 정보
   * @returns 충전 완료 메시지 또는 에러 메시지
   */
  @Post('charge')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async chargeBalance(
    @Body() balanceDto: BalanceReqDto,
  ): Promise<{ message: string }> {
    await this.balanceFacade.chargeBalance(balanceDto.userId, balanceDto.amount);
    return new ChargeBalanceResDto('Balance가 성공적으로 충전되었습니다')
  }

  /**
   * 잔액 조회 API
   * @param userId - 사용자 식별자
   * @returns 사용자의 현재 잔액
   */
  @Get(':userId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getBalance(@Param('userId', ParseUUIDPipe) userId: string): Promise<{ balance: number }> {
    const balance = await this.balanceFacade.getBalance(userId);
    return new GetBalanceResDto(balance)
  }
}
