import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../entities/user.entity'
import { DataSource } from 'typeorm';
import { UserServiceInterface } from './interfaces/user.service.interface';
@Injectable()
export class UserService implements UserServiceInterface{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,  // 유저 정보를 저장하는 저장소
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

}
