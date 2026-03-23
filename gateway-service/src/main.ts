import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gateway service running on http://localhost:${port}`);
  console.log(`GraphQL playground: http://localhost:${port}/graphql`);
}
bootstrap();
