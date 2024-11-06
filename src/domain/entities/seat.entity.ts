import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { SeatStatusEnum } from '../../common/enums/seat-status.enum';
@Entity('Seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column({ type: 'uuid' })
  concert_id: string; 

  @Column({ type: 'int' })
  seat_number: number;

  @Column({ type: 'varchar', length: 20, default: SeatStatusEnum.AVAILABLE })
  status: string; // available, reserved_temp, reserved_final

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'integer', default: 5000 })
  price: number;

}
