import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Concert } from './concert.entity';
import { v4 as uuid } from 'uuid';

@Entity('Queue')
export class Queue {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Concert, concert => concert.id)
  @JoinColumn({ name: 'concert_id' })
  concert: Concert;

  @Column({ type: 'int' })
  queue_position: number;

  @Column({ type: 'int' })
  wait_time_minutes: number; // 대기 시간 (분 단위)

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string; // JWT 토큰

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
