import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Concert } from './concert.entity';
import { v4 as uuid } from 'uuid';

@Entity('Queue')
export class Queue {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column({ type: 'uuid' })
  user_id: string; 

  @Column({ type: 'uuid' })
  concert_id: string; 

  @Column({ type: 'int' })
  queue_position: number;

  @Column({ type: 'int' })
  wait_time_minutes: number; // 대기 시간 (분 단위)

  @Column({ type: 'varchar', length: 1024 })
  token: string; // JWT 토큰

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
