import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AdminModule } from './admin/admin.module';
import { AdsModule } from './ads/ads.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { VehiculesModule } from './vehicules/vehicules.module';

@Module({
  imports: [PrismaModule, AuthModule, AdsModule, VehiculesModule, AdminModule, SearchModule],
  controllers: [AppController],
})
export class AppModule {}
