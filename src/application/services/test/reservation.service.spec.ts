import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from '../reservation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Concert } from '../../../domain/entities/concert.entity';
import { Seat } from '../../../domain/entities/seat.entity';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { DataSource, Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReservationService', () => {
  let service: ReservationService;
  let concertRepository: Repository<Concert>;
  let seatRepository: Repository<Seat>;
  let reservationRepository: Repository<Reservation>;
  let dataSource: DataSource;
  let schedulerRegistry: SchedulerRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Concert),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Seat),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Reservation),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              release: jest.fn(),
              rollbackTransaction: jest.fn(),
              manager: {
                findOne: jest.fn(),
                save: jest.fn(),
              },
            }),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    concertRepository = module.get<Repository<Concert>>(getRepositoryToken(Concert));
    seatRepository = module.get<Repository<Seat>>(getRepositoryToken(Seat));
    reservationRepository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
    dataSource = module.get<DataSource>(DataSource);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reserveSeat', () => {
    it('should reserve a seat successfully', async () => {
      const mockQueryRunner = dataSource.createQueryRunner();
      const reservationDto = { seatNumber: 1, userId: '123e4567-e89b-12d3-a456-426614174000', concertId: '123e4567-e89b-12d3-a456-426614174001' };
      const mockConcert = { id: '123e4567-e89b-12d3-a456-426614174001' };
      const mockSeat = { id: '123e4567-e89b-12d3-a456-426614174002', status: 'available', price: 100 };
      const mockReservation = { id: '123e4567-e89b-12d3-a456-426614174003' };

      jest.spyOn(mockQueryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockConcert)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSeat);
      jest.spyOn(mockQueryRunner.manager, 'save')
        .mockResolvedValueOnce(mockSeat)
        .mockResolvedValueOnce(mockReservation)
        .mockResolvedValueOnce(mockSeat);

      const result = await service.reserveSeat(reservationDto);

      expect(result).toEqual({
        message: '좌석 1이(가) 임시 예약되었습니다.',
        reservationId: '123e4567-e89b-12d3-a456-426614174003',
      });
    });

    it('should throw BadRequestException for invalid seat number', async () => {
      const reservationDto = { seatNumber: 51, userId: '123e4567-e89b-12d3-a456-426614174000', concertId: '123e4567-e89b-12d3-a456-426614174001' };
      await expect(service.reserveSeat(reservationDto)).rejects.toThrow(BadRequestException);
    });

  });

  describe('getAvailableSeats', () => {
    it('should return available seats for a given date', async () => {
      const date = '2023-05-01';
      const mockConcert = { id: '123e4567-e89b-12d3-a456-426614174001', max_seats: 50 };
      const mockSeats = [
        { seat_number: 1, status: 'reserved', updated_at: new Date() },
        { seat_number: 2, status: 'available', updated_at: new Date() },
      ];

      jest.spyOn(concertRepository, 'findOne').mockResolvedValue(mockConcert as Concert);
      jest.spyOn(seatRepository, 'find').mockResolvedValue(mockSeats as Seat[]);

      const result = await service.getAvailableSeats(date);

      expect(result).toEqual({
        date,
        concertId: '123e4567-e89b-12d3-a456-426614174001',
        availableSeats: expect.arrayContaining([
          expect.objectContaining({ seat_number: 2, status: 'available' }),
        ]),
      });
      expect(result.availableSeats.length).toBe(49); // 50 total seats - 1 reserved
    });

    it('should throw NotFoundException when concert is not found', async () => {
      const date = '2023-05-01';
      jest.spyOn(concertRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getAvailableSeats(date)).rejects.toThrow(NotFoundException);
    });
  });

});