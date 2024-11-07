import { MigrationInterface, QueryRunner } from "typeorm";

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

        let currentDate = new Date('2024-11-01');
        const twoWeeksLater = new Date('2024-11-30');

        while (currentDate <= twoWeeksLater) {
            // currentDate에 하루를 더한 후, 19시를 설정
            const reservationStartTime = new Date(currentDate);
            reservationStartTime.setDate(reservationStartTime.getDate() + 1); // 1일 더하기
            reservationStartTime.setHours(19, 0, 0, 0); // 19:00:00으로 설정
        
            // 예약 시작 시간 값을 ISO 문자열로 변환
            const reservationStartTimeISO = reservationStartTime.toISOString();
        
            await queryRunner.query(`
                INSERT INTO "Concerts" ("name", "venue", "concert_date", "max_seats", "created_at", "updated_at", "reservation_start_time")
                VALUES ('${concertName}', '${venue}', '${currentDate.toISOString().split('T')[0]}', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '${reservationStartTimeISO}');
            `);
            
            console.log(`Concert inserted for date: ${currentDate.toISOString().split('T')[0]} with reservation start time: ${reservationStartTimeISO}`);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const concertCount = await queryRunner.manager.query('SELECT COUNT(*) FROM "Concerts"');
        console.log(`Total concerts inserted: ${concertCount[0].count}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "Queue";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Reservations";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Seats";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Concerts";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "Users";`);
    }

}
