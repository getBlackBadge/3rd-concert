import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'jwt-secret'; // 환경 변수 사용

  generateToken(payload: any, expiresIn: string = '1h'): string {
    const tokenPayload = {
      ...payload,
      iat: Date.now(),
    };
    return jwt.sign(tokenPayload, this.jwtSecret, { expiresIn });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}