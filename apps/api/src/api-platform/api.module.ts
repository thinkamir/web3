import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { HmacGuard } from './hmac.guard';

@Module({
  controllers: [ApiController],
  providers: [ApiService, HmacGuard],
  exports: [ApiService],
})
export class ApiModule {}
