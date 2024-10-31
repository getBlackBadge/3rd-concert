import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../entities/user.entity'
// import { BalanceDto } from '../../../presentation/dto/balance.dto';
import { DataSource } from 'typeorm';
import { BalanceServiceInterface } from './interfaces/balance.service.interface';

@Injectable()
export class BalanceService implements BalanceServiceInterface{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,  // 유저 정보를 저장하는 저장소
    private readonly dataSource: DataSource
  ) {}

  async chargeBalance(userId: string, amount: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    user.balance = this.addUpBalanceAmount(user.balance, amount);
    await this.userRepository.save(user);  // 변경된 잔액 저장
  }

  async getBalanceByUserId(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.balance;  // 사용자의 현재 잔액 반환
  }

  async decreaseBalance(userId: string, amount: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      user.balance = this.cutOffBalanceAmount(user.balance, amount);
      await transactionalEntityManager.save(User, user);
    });
  }

  private addUpBalanceAmount(balance: number, amount: number): number {
    return balance + amount;
  }
  private cutOffBalanceAmount(balance: number, amount: number): number {
    return balance - amount;
  }
}
