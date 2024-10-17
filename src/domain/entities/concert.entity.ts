import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';
// 콘서트는 한 가지만 있다고 가정, 다만 날에 따라 장소, 좌석 수 등은 바뀔 수 있다.
@Entity('Concerts')
export class Concert {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  venue: string;

  @Column({ type: 'date' })
  concert_date: Date;

  @Column({ type: 'int', default: 50 })
  max_seats: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'int', default: 100 })
  max_queue: number;

  @Column({ type: 'int', default: 0 })
  queue_count: number;
}
