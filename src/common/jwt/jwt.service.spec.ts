import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const payload = { userId: '123', role: 'user' };
      const token = service.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate a token with custom expiration', () => {
      const payload = { userId: '123', role: 'user' };
      const token = service.generateToken(payload, '1h');
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(3600); // 1 hour in seconds
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: '123', role: 'user' };
      const token = service.generateToken(payload);
      const verified = service.verifyToken(token);
      expect(verified).toBeDefined();
      expect(verified.userId).toBe(payload.userId);
      expect(verified.role).toBe(payload.role);
    });

    it('should throw an error for an invalid token', () => {
      expect(() => service.verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a token', () => {
      const payload = { userId: '123', role: 'user' };
      const token = service.generateToken(payload);
      const decoded = service.decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('should return null for an invalid token', () => {
      const decoded = service.decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});