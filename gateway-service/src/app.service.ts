import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'FinOps SaaS - Gateway Service is running!';
  }
}
