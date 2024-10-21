import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { PaymentController } from '../payment.controller';
import { PaymentService } from '../../../application/services/payment.service';
import { PaymentDto } from '../../dto/payment.dto';

describe('PaymentController (Integration)', () => {
  let app: INestApplication;
  let paymentService: PaymentService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            processPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    paymentService = moduleFixture.get<PaymentService>(PaymentService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /payment', () => {
    it('should process payment successfully', async () => {
      const paymentDto: PaymentDto = {
        userId: uuidv4(),
        reservationId: uuidv4(),
        
      };
      
      const mockPaymentResult = {
        id: uuidv4(),
        status: 'completed',
        seatId: uuidv4(),
        amount: 100,
        message: '결제가 성공적으로 처리되었습니다.',
        ...paymentDto,
      };

      jest.spyOn(paymentService, 'processPayment').mockResolvedValue(mockPaymentResult);

      const response = await request(app.getHttpServer())
        .post('/payment')
        .send(paymentDto)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        message: '결제가 성공적으로 처리되었습니다.',
        data: mockPaymentResult,
      });

      expect(paymentService.processPayment).toHaveBeenCalledWith(paymentDto);
    });

    it('should handle payment processing error', async () => {
      const paymentDto: PaymentDto = {
        userId: uuidv4(),
        reservationId: uuidv4(),
        
      };

      jest.spyOn(paymentService, 'processPayment').mockRejectedValue(new Error('Payment failed'));

      const response = await request(app.getHttpServer())
        .post('/payment')
        .send(paymentDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toHaveProperty('message', 'Internal server error');
    });

    it('should validate UUID format for userId and reservationId', async () => {
      const invalidPaymentDto = {
        userId: 'invalid-uuid',
        reservationId: 'another-invalid-uuid',
        
      };

      const response = await request(app.getHttpServer())
        .post('/payment')
        .send(invalidPaymentDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('userId must be a UUID');
      expect(response.body.message).toContain('reservationId must be a UUID');
    });
  });
});