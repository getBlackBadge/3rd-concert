import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../payment.service';
import { BalanceService } from '../balance.service';
import { Repository } from 'typeorm';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// PaymentService에 대한 테스트 스위트
describe('PaymentService', () => {
  let paymentService: PaymentService;
  let balanceService: BalanceService;
  let reservationRepository: Repository<Reservation>;

  // 각 테스트 전에 실행되는 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        // BalanceService 모킹
        {
          provide: BalanceService,
          useValue: {
            getBalance: jest.fn(),
            decreaseBalance: jest.fn(),
          },
        },
        // Reservation 리포지토리 모킹
        {
          provide: getRepositoryToken(Reservation),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    // 서비스와 의존성 주입
    paymentService = module.get<PaymentService>(PaymentService);
    balanceService = module.get<BalanceService>(BalanceService);
    reservationRepository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
  });

  // processPayment 메소드에 대한 테스트 그룹
  describe('processPayment', () => {
    // 성공적인 결제 처리 테스트
    it('should process payment successfully', async () => {
      const mockReservation = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        seat: { id: 'c2af8c3a-0f82-4c3a-9b7d-ce8c0c7e3f42' },
        amount: 100,
        status: 'pending',
      };
      const paymentDto = {
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        reservationId: '550e8400-e29b-41d4-a716-446655440000'
      };

      // 모의 함수 설정
      jest.spyOn(reservationRepository, 'findOne').mockResolvedValue(mockReservation as any);
      jest.spyOn(balanceService, 'getBalance').mockResolvedValue(200);
      jest.spyOn(balanceService, 'decreaseBalance').mockResolvedValue(undefined);
      jest.spyOn(reservationRepository, 'save').mockResolvedValue({ ...mockReservation, status: 'completed' } as any);

      const result = await paymentService.processPayment(paymentDto);

      // 결과 검증
      expect(result).toEqual({
        userId: 1,
        reservationId: 1,
        seatId: 1,
        amount: 100,
        status: 'success',
        message: '결제가 성공적으로 처리되었습니다.',
      });
    });

    // 예약이 존재하지 않을 때 NotFoundException 발생 테스트
    it('should throw NotFoundException when reservation is not found', async () => {
      jest.spyOn(reservationRepository, 'findOne').mockResolvedValue(null);

      await expect(paymentService.processPayment({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        reservationId: '550e8400-e29b-41d4-a716-446655440000'
      }))
        .rejects.toThrow(NotFoundException);
    });

    // 잔액 부족 시 BadRequestException 발생 테스트
    it('should throw BadRequestException when balance is insufficient', async () => {
      const mockReservation = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        seat: { id: 'c2af8c3a-0f82-4c3a-9b7d-ce8c0c7e3f42' },
        amount: 100,
        status: 'pending',
      };

      jest.spyOn(reservationRepository, 'findOne').mockResolvedValue(mockReservation as any);
      jest.spyOn(balanceService, 'getBalance').mockResolvedValue(50);

      await expect(paymentService.processPayment({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        reservationId: '550e8400-e29b-41d4-a716-446655440000'
      }))
        .rejects.toThrow(BadRequestException);
    });

    // 예약 상태가 'pending'이 아닐 때 BadRequestException 발생 테스트
    it('should throw BadRequestException when reservation status is not pending', async () => {
      const mockReservation = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        seat: { id: 'c2af8c3a-0f82-4c3a-9b7d-ce8c0c7e3f42' },
        amount: 100,
        status: 'completed',
      };

      jest.spyOn(reservationRepository, 'findOne').mockResolvedValue(mockReservation as any);
      jest.spyOn(balanceService, 'getBalance').mockResolvedValue(200);
      await expect(paymentService.processPayment({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        reservationId: '550e8400-e29b-41d4-a716-446655440000'
      }))
        .rejects.toThrow(BadRequestException);
    });
  });
});