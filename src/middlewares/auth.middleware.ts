/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  NestMiddleware,
  Injectable,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  async use(req: any, res: Response, next: NextFunction) {
    console.log('[+]', 'in auth');
    try {
      const authHeaders = req.headers.authorization;
      if (!authHeaders) {
        throw new HttpException(
          'Provide Auth token to continue',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (authHeaders && (authHeaders as string).split(' ')[1]) {
        const token = (authHeaders as string).split(' ')[1];
        const decoded: any = jwt.verify(
          token,
          this.configService.get('ACCESS_TOKEN_SECRET'),
        );
        const user = await this.prisma.xpert.findUnique({
          where: {
            id: decoded._id,
          },
        });

        if (!user) {
          throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
        }
        // if (!user.is_admin) {
        //   throw new HttpException(
        //     'INvalid Access, Contact Support',
        //     HttpStatus.UNAUTHORIZED,
        //   );
        // }
        console.log('[+]', 'authenticating ==>', user.email);
        req.user = user;
        next();
      } else {
        throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
