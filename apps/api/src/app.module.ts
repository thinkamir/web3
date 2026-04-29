import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { CampaignModule } from './campaign/campaign.module';
import { PointsModule } from './points/points.module';
import { DrawModule } from './draw/draw.module';
import { ProjectModule } from './project/project.module';
import { RiskModule } from './risk/risk.module';
import { ApiModule } from './api-platform/api.module';
import { ReferralModule } from './referral/referral.module';
import { WebhookModule } from './webhook/webhook.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    TaskModule,
    CampaignModule,
    PointsModule,
    DrawModule,
    ProjectModule,
    RiskModule,
    ApiModule,
    ReferralModule,
    WebhookModule,
  ],
})
export class AppModule {}
