import { MigrationInterface, QueryRunner } from "typeorm";
import { v7 as uuidv7 } from 'uuid';
import { v4 as uuidv4 } from 'uuid';

export class Seed1729080559632 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`
            CREATE TABLE "Concerts" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar(255) NOT NULL,
                "venue" varchar(255) NOT NULL,
                "concert_date" date NOT NULL,
                "max_seats" int DEFAULT 50,
                "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "reservation_start_time" timestamp
            );
        `);
        
        await queryRunner.query(`
            CREATE TABLE "Seats" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "concert_id" uuid,
                "seat_number" int NOT NULL,
                "status" varchar(20) DEFAULT 'available',
                "price" int NOT NULL,
                "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                UNIQUE ("concert_id", "seat_number")
            );
        `);
                
        await queryRunner.query(`
            CREATE TABLE "Users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "username" varchar(255) NOT NULL,
                "isAdmin" boolean DEFAULT false,
                "balance" int DEFAULT 0,
                "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await queryRunner.query(`
            CREATE TABLE "Reservations" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "concert_id" uuid,
                "seat_id" uuid,
                "status" varchar(20) DEFAULT 'pending',
                "amount" decimal(10, 2) NOT NULL,
                "reserved_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "payment_deadline" timestamp,
                "completed_at" timestamp,
                "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
            );
        `);
  
        const concertName = 'MainConcert';
        const venue = 'Main Hall';
        const maxEntries = 30;
        let currentDate = new Date('2024-11-01');
        
        for (let i = 0; i < maxEntries; i++) {
            const concertDateISO = currentDate.toISOString().split('T')[0];
        
            // Set reservation start time to 19:00:00 on the current concert date
            const reservationStartTime = new Date(currentDate);
            reservationStartTime.setHours(19, 0, 0, 0);
            const reservationStartTimeISO = reservationStartTime.toISOString();
            const concertId = uuidv7(); // Generate a UUID v7
            // const concertId = uuidv4(); // Generate a UUID v4
        
            await queryRunner.query(`
                INSERT INTO "Concerts" ("id", "name", "venue", "concert_date", "max_seats", "created_at", "updated_at", "reservation_start_time")
                VALUES ('${concertId}', '${concertName}', '${venue}', '${concertDateISO}', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '${reservationStartTimeISO}');
            `);

            for (let i = 1; i < 51; i ++){
                await queryRunner.query(`
                    INSERT INTO "Seats" ("concert_id", "seat_number", "status", "created_at", "updated_at", "price")
                    VALUES ('${concertId}', ${i}, 'available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 500);
                `);
            }

            
        
        
            // console.log(`Concert inserted for date: ${concertDateISO} with reservation start time: ${reservationStartTimeISO}`);
            
            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }


        const concertCount = await queryRunner.manager.query('SELECT COUNT(*) FROM "Concerts"');
        console.log(`Total concerts inserted: ${concertCount[0].count}`);
        await queryRunner.manager.query('CREATE INDEX idx_concert_id_seat_number ON "Seats" (concert_id, seat_number)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "Queue";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Reservations";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Seats";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Concerts";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Users";`);
    }

}
