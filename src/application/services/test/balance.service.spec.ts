import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BalanceService } from '../balance.service';
import { User } from '../../../domain/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// BalanceService에 대한 테스트 스위트
describe('BalanceService', () => {
  let service: BalanceService;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  // 모의 사용자 저장소 객체 생성
  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  // 모의 데이터 소스 객체 생성
  const mockDataSource = {
    transaction: jest.fn(),
  };

  // 각 테스트 전에 실행되는 설정
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    // 테스트에 사용할 서비스와 저장소 초기화
    service = module.get<BalanceService>(BalanceService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  // 서비스가 정의되었는지 확인하는 테스트
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // chargeBalance 메소드에 대한 테스트 그룹
  describe('chargeBalance', () => {
    // 잔액 충전이 성공적으로 이루어지는지 테스트
    it('should charge balance successfully', async () => {
      const mockUser = { id: '1', balance: 100 };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, balance: 200 });

      await service.chargeBalance('1', 100);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...mockUser, balance: 200 });
    });

    // 사용자를 찾을 수 없을 때 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.chargeBalance('1', 100)).rejects.toThrow(NotFoundException);
    });
  });

  // getBalance 메소드에 대한 테스트 그룹
  describe('getBalance', () => {
    // 사용자 잔액을 정확히 반환하는지 테스트
    it('should return user balance', async () => {
      const mockUser = { id: '1', balance: 100 };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const balance = await service.getBalance('1');

      expect(balance).toBe(100);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    // 사용자를 찾을 수 없을 때 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getBalance('1')).rejects.toThrow(NotFoundException);
    });
  });

  // decreaseBalance 메소드에 대한 테스트 그룹
  describe('decreaseBalance', () => {
    // 잔액 감소가 성공적으로 이루어지는지 테스트
    it('should decrease balance successfully', async () => {
      const mockUser = { id: '1', balance: 100 };
      mockDataSource.transaction.mockImplementation(async (callback) => {
        await callback({
          findOne: jest.fn().mockResolvedValue(mockUser),
          save: jest.fn().mockResolvedValue({ ...mockUser, balance: 50 }),
        });
      });

      await service.decreaseBalance('1', 50);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    // 사용자를 찾을 수 없을 때 NotFoundException을 던지는지 테스트
    it('should throw NotFoundException when user not found', async () => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        await callback({
          findOne: jest.fn().mockResolvedValue(null),
        });
      });

      await expect(service.decreaseBalance('1', 50)).rejects.toThrow(NotFoundException);
    });

    // 잔액이 부족할 때 BadRequestException을 던지는지 테스트
    it('should throw BadRequestException when insufficient balance', async () => {
      const mockUser = { id: '1', balance: 30 };
      mockDataSource.transaction.mockImplementation(async (callback) => {
        await callback({
          findOne: jest.fn().mockResolvedValue(mockUser),
        });
      });

      await expect(service.decreaseBalance('1', 50)).rejects.toThrow(BadRequestException);
    });
  });
});