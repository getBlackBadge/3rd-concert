import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'jwt-secret'; // 환경 변수 사용

  generateToken(payload: any, expiresIn: string = '1h'): string {
    const tokenPayload = {
      ...payload,
      iat: Date.now(), // 발행 시간
    };
  
    // 만약 exp가 이미 존재하면, expiresIn을 사용하지 않고 exp만으로 토큰을 생성
    if (tokenPayload.exp) {
      return jwt.sign(tokenPayload, this.jwtSecret);
    }
  
    // exp가 없다면 expiresIn을 사용하여 토큰을 생성
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