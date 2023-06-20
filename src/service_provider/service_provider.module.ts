/* eslint-disable prettier/prettier */
import {
  MiddlewareConsumer,
  Module,
  forwardRef,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ServiceProviderController } from './service_provider.controller';
import { ServiceProviderService } from './service_provider.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { AuthMiddleware } from 'src/middlewares/auth.middleware';
import { RequestService } from 'src/request/request.service';
import { RequestModule } from 'src/request/request.module';
@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/sp_images',
    }),
    // forwardRef(() => RequestModule),
  ],
  controllers: [ServiceProviderController],
  providers: [ServiceProviderService, PrismaService, ConfigService],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    // consumer.apply(AuthMiddleware).forRoutes({
    // });
  }
}
