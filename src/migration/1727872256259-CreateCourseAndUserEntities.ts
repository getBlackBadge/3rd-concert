// import { MigrationInterface, QueryRunner } from "typeorm";

// export class CreateCourseAndUserEntities1727872256259 implements MigrationInterface {
//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`
//             CREATE TABLE "users" (
//                 id SERIAL PRIMARY KEY,
//                 name VARCHAR NOT NULL
//             );
//         `);

//         await queryRunner.query(`
//             CREATE TABLE "courses" (
//                 id SERIAL PRIMARY KEY,
//                 title VARCHAR NOT NULL,
//                 description TEXT NOT NULL,
//                 maxParticipants INT NOT NULL DEFAULT 30,
//                 startAt TIMESTAMP NOT NULL,
//                 endAt TIMESTAMP NOT NULL,
//                 createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             );
//         `);

//         await queryRunner.query(`
//             CREATE TABLE "course_apply_histories" (
//                 id SERIAL PRIMARY KEY,
//                 user_id INT REFERENCES "users"(id),
//                 course_id INT REFERENCES "courses"(id),
//                 registration_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 UNIQUE (user_id, course_id)
//             );
//         `);

//         // Insert test data for users
//         await queryRunner.query(`
//             INSERT INTO "users" (name) VALUES
//             ('김형진'),
//             ('박지희'),
//             ('이강욱'),
//             ('이영준'),
//             ('김영호'),
//             ('손흥민'),
//             ('박재범'),
//             ('봉준호');
//         `);

//         // Insert test data for courses
//         await queryRunner.query(`
//             INSERT INTO "courses" (title, description, maxParticipants, startAt, endAt) VALUES
//             ('타입스크립트 입문', '타입스크립트의 기초를 배웁니다', 30, '2024-10-05 13:00:00', '2024-10-05 18:00:00'),
//             ('리액트 고급 과정', '리액트 훅과 패턴에 대해 깊이 있게 학습합니다', 30, '2024-10-12 13:00:00', '2024-10-12 18:00:00'),
//             ('데이터베이스 설계', '효율적인 데이터베이스 설계 방법을 배웁니다', 30, '2024-10-19 13:00:00', '2024-10-19 18:00:00'),
//             ('Node.js 백엔드 개발', 'Node.js를 이용한 서버 개발의 기초를 학습합니다', 30, '2024-10-26 13:00:00', '2024-10-26 18:00:00'),
//             ('GraphQL API 구축', 'GraphQL을 이용한 효율적인 API 설계와 구현을 배웁니다', 30, '2024-11-02 13:00:00', '2024-11-02 18:00:00'),
//             ('Docker 컨테이너화', 'Docker를 이용한 애플리케이션 컨테이너화 방법을 학습합니다', 30, '2024-11-09 13:00:00', '2024-11-09 18:00:00'),
//             ('클라우드 컴퓨팅 기초', 'AWS를 중심으로 클라우드 컴퓨팅의 기본 개념을 배웁니다', 30, '2024-11-16 13:00:00', '2024-11-16 18:00:00'),
//             ('머신러닝 입문', '파이썬을 이용한 기초적인 머신러닝 모델 구현을 학습합니다', 30, '2024-11-23 13:00:00', '2024-11-23 18:00:00');
//         `);

//         // Insert test data for course_apply_histories
//         await queryRunner.query(`
//             INSERT INTO "course_apply_histories" (user_id, course_id, registration_datetime) VALUES
//             (1, 1, '2024-10-05 13:00:00'),
//             (2, 1, '2024-10-05 13:00:00'),
//             (3, 2, '2024-10-12 13:00:00');
//         `);
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`DROP TABLE "course_apply_histories";`);
//         await queryRunner.query(`DROP TABLE "courses";`);
//         await queryRunner.query(`DROP TABLE "users";`);
//     }
// }
