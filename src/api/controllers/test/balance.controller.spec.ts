import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { BalanceController } from '../balance.controller';
import { BalanceService } from '../../../application/services/balance.service';
import { v4 as uuidv4 } from 'uuid';

describe('BalanceController (Integration)', () => {
  let app: INestApplication;
  let balanceService: BalanceService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BalanceController],
      providers: [
        {
          provide: BalanceService,
          useValue: {
            chargeBalance: jest.fn(),
            getBalance: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    balanceService = moduleFixture.get<BalanceService>(BalanceService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /balance', () => {
    it('should charge balance successfully', async () => {
      const userId = uuidv4();
      const amount = 100;

      jest.spyOn(balanceService, 'chargeBalance').mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
      .post(`/balance/charge`)
      .send({ userId, amount })
      // .expect(201);

      console.log('Response body:', response.body);
      console.log('Response headers:', response.headers);

      expect(response.body).toEqual({ message: 'Balance charged successfully.' });
      expect(balanceService.chargeBalance).toHaveBeenCalledWith(userId, amount);
    });
  });

  describe('GET /balance/:userId', () => {
    it('should return user balance', async () => {
      const userId = uuidv4();
      const expectedBalance = 500;

      jest.spyOn(balanceService, 'getBalance').mockResolvedValue(expectedBalance);

      const response = await request(app.getHttpServer())
        .get(`/balance/${userId}`)
        .expect(200);

      expect(response.body).toEqual({ balance: expectedBalance });
      expect(balanceService.getBalance).toHaveBeenCalledWith(userId);
    });
  });
});