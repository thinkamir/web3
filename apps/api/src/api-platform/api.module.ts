import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { HmacGuard } from './hmac.guard';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [ProjectModule],
  controllers: [ApiController],
  providers: [ApiService, HmacGuard],
  exports: [ApiService],
})
export class ApiModule {}
