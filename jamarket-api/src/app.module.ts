import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AdsModule } from './ads/ads.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { VehiculesModule } from './vehicules/vehicules.module';

@Module({
  imports: [PrismaModule, AuthModule, AdsModule, VehiculesModule],
  controllers: [AppController],
})
export class AppModule {}
