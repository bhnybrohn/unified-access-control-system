/* eslint-disable prettier/prettier */
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { XpertController } from './xpert.controller';
import { XpertService } from './xpert.service';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthMiddleware } from 'src/middlewares/auth.middleware';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/sp_images',
    }),
  ],
  providers: [XpertService, PrismaService, ConfigService, JwtService],
  controllers: [XpertController],
})
export class XpertModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: '/api/xpert/sign_in',
          method: RequestMethod.POST,
        },
        {
          path: '/api/xpert/sign_out',
          method: RequestMethod.POST,
        },
        {
          path: '/api/xpert/:email',
          method: RequestMethod.PUT,
        },
        {
          path: '/api/xpert/revoke/:email',
          method: RequestMethod.PATCH,
        },
      )
      .forRoutes({ path: '/api/xpert', method: RequestMethod.GET });
  }
}
