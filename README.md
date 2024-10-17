## swagger 캡쳐본
<img width="1440" alt="Screenshot 2024-10-18 at 1 33 26 AM" src="https://github.com/user-attachments/assets/5dca9e2d-39a7-412e-9e09-6ed2576b9ba5">

## swagger 구현부
```javascript
/src.main.ts:
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('API 문서')
    .setDescription('콘서트 예약 서비스입니다')
    .setVersion('1.0')
    .addTag('api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Swagger UI 경로 설정

  await app.listen(3000);
}
bootstrap();
```