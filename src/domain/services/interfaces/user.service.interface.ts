import { User } from '../../entities/user.entity'
export interface UserServiceInterface {
  getUserById(userId: string): Promise<User>;
  validateUserById(userId: string): Promise<boolean>;
}