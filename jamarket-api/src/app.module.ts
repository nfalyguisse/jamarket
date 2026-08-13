import { CatalogModule } from './catalog/catalog.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AdminModule } from './admin/admin.module';
import { AdsModule } from './ads/ads.module';
import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ChatModule } from './chat/chat.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { UploadModule } from './upload/upload.module';
import { VehiculesModule } from './vehicules/vehicules.module';

/** Fenêtre globale : 100 req / 60 s par IP (anti-abus / DoS léger). */
const THROTTLE_TTL_MS = Number(process.env.THROTTLE_TTL_MS ?? 60_000);
const THROTTLE_LIMIT = Number(process.env.THROTTLE_LIMIT ?? 100);

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: THROTTLE_TTL_MS,
        limit: THROTTLE_LIMIT,
      },
    ]),
    PrismaModule,
    MetricsModule,
    AuthModule,
    AdsModule,
    VehiculesModule,
    AdminModule,
    SearchModule,
    UploadModule,
    CatalogModule,
    FavoritesModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
