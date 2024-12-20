import { Injectable } from '@nestjs/common';
import { BalanceService } from '../../domain/services/balance.service';
import { UserService } from '../../domain/services/user.service';
import { RedisLockManager } from '../../common/managers/locks/redis-wait-lock.manager';
import { EventEmitterService } from '../../domain/services/event-emitter.service';

@Injectable()
export class BalanceFacade {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly userService: UserService,
    private readonly redisLockManager: RedisLockManager,
    private readonly eventEmitterService: EventEmitterService,

  ) {}

  /**
   * 잔액 충전 로직
   * @param userId - 사용자 식별자
   * @param amount - 충전할 금액
   * @returns 충전 성공 여부
   */
  async chargeBalance(userId: string, amount: number): Promise<void> {
    this.userService.validateUserById(userId)
    const result = this.balanceService.chargeBalance(userId, amount)
    this.eventEmitterService.sendDataPlatform()
    return result
  }

  /**
   * 잔액 조회 로직
   * @param userId - 사용자 식별자
   * @returns 사용자의 현재 잔액
   */
  async getBalance(userId: string): Promise<number> {
    this.userService.validateUserById(userId)
    return this.balanceService.getBalanceByUserId(userId)
  }

    /**
   * 잔액 감소 로직 (락 사용)
   * @param userId - 사용자 식별자
   * @param amount - 감소시킬 금액
   * @returns void
   * @throws InsufficientBalanceException - 잔액이 부족한 경우
   * @throws NotFoundException - 사용자를 찾을 수 없는 경우
   */
    async decreaseBalance(userId: string, amount: number): Promise<void> {
      this.userService.validateUserById(userId)
      return await this.redisLockManager.withLockBySrc(userId, "user", async () => {
        return await this.balanceService.decreaseBalance(userId, amount);
      });
    }
}
