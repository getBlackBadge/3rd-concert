import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../entities/user.entity'
import { Queue } from '../entities/queue.entity'
import { DataSource } from 'typeorm';
import { UserServiceInterface } from './interfaces/user.service.interface';

@Injectable()
export class UserService implements UserServiceInterface{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,  // 유저 정보를 저장하는 저장소
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>
  ) {}

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user
  }

  async validateUserById(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return true
  }

  async getUserByQueueId(queueId: string): Promise<User> {
    const queue = await this.queueRepository.findOne({
      where: { id: queueId },
    });
    if (!queue) {
      throw new NotFoundException('큐를 찾을 수 없습니다')
    }
    const userId = queue.user_id
    return this.getUserById(userId)
  }
}
