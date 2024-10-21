import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { testFunc } from './utils/util-functions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3010);
  testFunc();
}
bootstrap();
