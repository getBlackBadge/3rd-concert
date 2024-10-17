import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Concert } from './concert.entity';
import { Seat } from './seat.entity';
import { v4 as uuid } from 'uuid';

@Entity('Reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Concert, concert => concert.id)
  @JoinColumn({ name: 'concert_id' })
  concert: Concert;

  @ManyToOne(() => Seat, seat => seat.id)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, completed, canceled

  @Column({ type: 'integer' })
  amount: number; // 예약 금액 (예: 실제 구매 티켓 가격 (할인 이벤트 등 적용 후) )

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reserved_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  payment_deadline: Date; // 결제 마감 시간 (예: 예약 후 5분)

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
