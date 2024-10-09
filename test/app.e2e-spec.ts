import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health-check (GET)', () => {
    return request(app.getHttpServer())
      .get('/health-check')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/courses/apply/:courseId (POST)', () => {
    const courseId = '123';
    return request(app.getHttpServer())
      .post(`/courses/apply/${courseId}`)
      .send({ userId: 'user123' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', '신청 완료');
      });
  });

  it('/courses (GET)', () => {
    return request(app.getHttpServer())
      .get('/courses')
      .query({
        startAt: '2024-01-01',
        endAt: '2024-01-31',
        limit: 10,
        offset: 0,
      })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBeTruthy();
      });
  });

  it('/courses/apply (GET)', () => {
    const userId = 'abc';
    return request(app.getHttpServer())
      .get('/courses/apply')
      .query({ userId })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBeTruthy();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});