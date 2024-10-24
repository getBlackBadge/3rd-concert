import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { winstonLogger } from './common/config/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: winstonLogger, // replacing logger
  });

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
