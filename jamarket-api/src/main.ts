import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  // Helmet avant CORS / routes : en-têtes HTTP de sécurité (OWASP A05)
  // CSP assouplie hors prod pour ne pas casser Swagger UI (/api/docs).
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:4000,http://localhost:4200'
  )
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Jamarket API')
      .setDescription(
        'API REST de la plateforme Jamarket — marketplace automobile B2B2C pour garages et acheteurs. ' +
          'Authentification JWT Bearer pour les routes protégées ; le refresh token s’envoie dans le corps JSON.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Access token JWT obtenu via /api/auth/login ou /api/auth/admin/login',
        },
        'access-token',
      )
      .addTag('Health', 'Santé de l’API et de la base de données')
      .addTag('Auth', 'Inscription, connexion, profil et droit à l’oubli')
      .addTag('Annonces', 'CRUD et consultation des annonces véhicules')
      .addTag('Véhicules', 'Fiches techniques véhicules du stock')
      .addTag('Upload', 'Upload et suppression d’images véhicules')
      .addTag('Recherche', 'Moteur de recherche et options de filtres')
      .addTag('Catalogue', 'Marques, modèles et types de véhicules')
      .addTag('Admin Users', 'Gestion des comptes (super-admin)')
      .addTag('Admin Roles', 'Gestion des rôles et droits (super-admin)')
      .addTag('Chat', 'Messagerie liée aux annonces (REST + WebSocket /chat)')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: true,
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
