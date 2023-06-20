/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceProviderModule } from './service_provider/service_provider.module';
import { RequestModule } from './request/request.module';
import { PermissionModule } from './permission/permission.module';
import { XpertModule } from './xpert/xpert.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { join } from 'path';
// import { DMMFClass } from '@prisma/client/runtime';
// import * as AdminJSPrisma from '@adminjs/prisma';
// const adminjsUploadFeature = import('@adminjs/prisma');
// import AdminJS from 'adminjs';
// const AdminJS = import('adminjs');

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'password',
};

const authenticate = async (email: string, password: string) => {
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return Promise.resolve(DEFAULT_ADMIN);
  }
  return null;
};

@Module({
  imports: [
    // import('adminjs').registerAdapter({
    //   Resource: AdminJSPrisma.Resource,
    //   Database: AdminJSPrisma.Database,
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    XpertModule,
    ServiceProviderModule,
    RequestModule,
    PermissionModule,
    PrismaModule,
    // import('@adminjs/nestjs').then(({ AdminModule }) =>
    //   AdminModule.createAdminAsync({
    //     // useFactory: () => ({
    //     //   adminJsOptions: {
    //     //     rootPath: '/admin',
    //     //     resources: [],
    //     //   },
    //     //   auth: {
    //     //     authenticate,
    //     //     cookieName: 'adminjs',
    //     //     cookiePassword: 'secret',
    //     //   },
    //     //   sessionOptions: {
    //     //     resave: true,
    //     //     saveUninitialized: true,
    //     //     secret: 'secret',
    //     //   },
    //     // }),
    //     useFactory: () => {
    //       const prisma = new PrismaService();
    //       const dmmf = (prisma as any)._baseDmmf as DMMFClass;
    //       return {
    //         adminJsOptions: {
    //           rootPath: '/admin',
    //           resources: [
    //             {
    //               resource: { model: dmmf.modelMap.Publisher, client: prisma },
    //               options: {},
    //             },
    //           ],
    //         },
    //       };
    //     },
    //   }),
    // ),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
