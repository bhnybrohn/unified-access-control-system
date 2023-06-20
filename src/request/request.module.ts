/* eslint-disable prettier/prettier */
import {
  Module,
  forwardRef,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ServiceProviderService } from 'src/service_provider/service_provider.service';
import { ServiceProviderModule } from 'src/service_provider/service_provider.module';
import { AuthMiddleware } from 'src/middlewares/auth.middleware';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [],
  controllers: [RequestController],
  providers: [
    RequestService,
    ConfigService,
    PrismaService,
    ServiceProviderService,
  ],
  exports: [RequestService, ServiceProviderService],
})
export class RequestModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      {
        path: '/api/request/manual_process',
        method: RequestMethod.POST,
      },
      {
        path: '/api/request/sp/create',
        method: RequestMethod.POST,
      },
      {
        path: '/api/request/permission/create',
        method: RequestMethod.POST,
      },
      {
        path: '/api/request/sp_toggle',
        method: RequestMethod.POST,
      },
      {
        path: '/api/request/permission/modify',
        method: RequestMethod.POST,
      },
      {
        path: '/api/request/sp/edit/:id',
        method: RequestMethod.PUT,
      },
      {
        path: '/api/request/xpert/revoke_access',
        method: RequestMethod.PUT,
      },
    );
  }
}
