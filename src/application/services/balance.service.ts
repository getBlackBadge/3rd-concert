import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity'
import { BalanceDto } from '../../api/dto/balance.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,  // 유저 정보를 저장하는 저장소
    private readonly dataSource: DataSource
  ) {}

  /**
   * 잔액 충전 로직
   * @param userId - 사용자 식별자
   * @param amount - 충전할 금액
   * @returns 충전 성공 여부
   */
  async chargeBalance(userId: string, amount: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.balance += amount;  // 잔액 충전 FIXME: 객체지향으로!
    await this.userRepository.save(user);  // 변경된 잔액 저장
  }

  /**
   * 잔액 조회 로직
   * @param userId - 사용자 식별자
   * @returns 사용자의 현재 잔액
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.balance;  // 사용자의 현재 잔액 반환
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
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });
  
        if (!user) {
          throw new NotFoundException('User not found');
        }
  
        if (user.balance < amount) {
          throw new BadRequestException('Insufficient balance');
        }
  
        user.balance -= amount;
        await transactionalEntityManager.save(User, user);
      });
    }
}
