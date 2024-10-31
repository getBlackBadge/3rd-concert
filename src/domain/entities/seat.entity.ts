import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity('Seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column({ type: 'uuid' })
  concert_id: string; 

  @Column({ type: 'int' })
  seat_number: number;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: string; // available, reserved_temp, reserved_final

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'integer' })
  price: number;

}
