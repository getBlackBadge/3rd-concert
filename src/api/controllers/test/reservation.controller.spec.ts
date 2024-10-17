import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from '../../../application/services/reservation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Concert } from '../../../domain/entities/concert.entity';
import { Seat } from '../../../domain/entities/seat.entity';
import { Repository } from 'typeorm';

describe('ReservationService', () => {
  let service: ReservationService;
  let concertRepository: jest.Mocked<Repository<Concert>>;
  let seatRepository: jest.Mocked<Repository<Seat>>;

  beforeEach(async () => {
    const mockConcertRepository = {
      findOne: jest.fn(),
    };
    const mockSeatRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Concert),
          useValue: mockConcertRepository,
        },
        {
          provide: getRepositoryToken(Seat),
          useValue: mockSeatRepository,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    concertRepository = module.get(getRepositoryToken(Concert));
    seatRepository = module.get(getRepositoryToken(Seat));
  });

  it('should return available seats', async () => {
    // 콘서트 생성
    const concertDate = new Date('2024-01-01');
    const concert = {
      id: '1',
      name: 'Test Concert',
      venue: 'Test Venue',
      concert_date: concertDate,
      max_seats: 50,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // 예약된 좌석 생성 (40개 예약, 10개 남김)
    const reservedSeats = Array.from({ length: 40 }, (_, i) => ({
      seat_number: i + 1,
      status: 'reserved',
      concert: { id: concert.id },
    }));

    // Mock repository 메소드
    concertRepository.findOne.mockResolvedValue(concert as Concert);
    seatRepository.find.mockResolvedValue(reservedSeats as Seat[]);

    // 테스트 실행
    const result = await service.getAvailableSeats('2024-01-01');

    // 결과 검증
    expect(result).toHaveLength(10);
    expect(result).toEqual([41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);

    // Repository 메소드 호출 확인
    expect(concertRepository.findOne).toHaveBeenCalledWith({ where: { concert_date: concertDate } });
    expect(seatRepository.find).toHaveBeenCalledWith({ 
      where: { concert: { id: concert.id }, status: 'available' }
    });
  });
});