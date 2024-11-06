import { ReservationStatusEnum } from '../../common/enums/reservation-status.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity('Reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column({ type: 'uuid' })
  user_id: string; 

  @Column({ type: 'uuid' })
  concert_id: string; 

  @Column({ type: 'uuid' })
  seat_id: string; 

  @Column({ type: 'varchar', length: 20, default: ReservationStatusEnum.PENDING })
  status: string; // pending, completed, canceled, expired

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
