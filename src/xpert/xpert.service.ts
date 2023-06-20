/* eslint-disable prettier/prettier */
import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import {
  DATA_CREATED,
  DATA_FETCHED,
  DATA_MODIFIED,
} from 'src/helpers/api.constants';

import CryptoJS, { SHA256, enc } from 'crypto-js';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SSO } from 'afex-sso';
import { APIResponse } from 'src/helpers/api.response';
import { Prisma, xpert } from '@prisma/client';
import { getLogs, logger } from 'src/logger';
import axios, { Axios, AxiosResponse } from 'axios';
@Injectable()
export class XpertService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  private generateToken(id: number) {
    const accessToken = this.jwtService.sign(
      { _id: id },
      {
        algorithm: 'HS256',
        secret: this.config.get('ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_LIFE'),
      },
    );
    return accessToken;
  }
  async XpertSignIn(session_id: string) {
    try {
      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + session_id;

      const digest = SHA256(hash_value).toString(enc.Hex);

      const from_sso = new SSO(sso_pk, digest, session_id);
      const user_obj = await from_sso.getUser();

      const email = user_obj?.data?.user?.email;
      console.log('[from sso]', user_obj);
      if (email && user_obj.data.session_identifier) {
        const user = await this.prisma.xpert.findUnique({
          where: {
            email,
          },
        });
        console.log('[from_db]', user);

        logger.info(
          `${user?.first_name} ${
            user?.last_name
          } Logged in on ${new Date().toDateString()} `,
          {
            data: {},
            type: 'Auth',
          },
        );

        return user && user.is_admin
          ? APIResponse.successResponse(
              { user, accesstoken: this.generateToken(user.id) },
              HttpStatus.OK,
              DATA_FETCHED,
            )
          : user && !user.is_admin
          ? APIResponse.errorResponse({
              statusCode: HttpStatus.BAD_REQUEST,
              message: `${email} does not have access to this system`,
            })
          : APIResponse.errorResponse({
              statusCode: HttpStatus.BAD_REQUEST,
              message: `${email} is an Invalid email ,please contact support.`,
            });
      }
      return APIResponse.errorResponse({
        data: user_obj.data,
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid Entity from SSO, please contact support`,
      });
    } catch (error) {
      // console.log(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async XpertSignOut(email: string) {
    try {
      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');

      const hash_value = sso_pk + sso_sk + Date.now();

      const digest = SHA256(hash_value).toString(enc.Hex);

      const from_sso = new SSO(sso_pk, digest, Date.now());
      const user_obj = await from_sso.signout(email);

      // console.log('[from sso]', user_obj);

      const user = await this.prisma.xpert.findUnique({
        where: {
          email,
        },
      });
      //
      logger.info(
        `${user?.first_name} ${
          user?.last_name
        } Signed Out on ${new Date().toDateString()} `,
        {
          data: {},
          type: 'Auth',
        },
      );

      return APIResponse.successResponse(user_obj, HttpStatus.OK, DATA_FETCHED);
    } catch (error) {
      // console.log(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async GetXpert(
    user: Prisma.xpertWhereUniqueInput | { id: number },
  ): Promise<APIResponse> {
    try {
      const xpert = await this.prisma.xpert.findUnique({
        where: {
          id: user.id,
        },
        include: {
          permission: true,
          request: true,
        },
      });
      return APIResponse.successResponse(xpert, HttpStatus.OK, DATA_CREATED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async edit_xpert(email: string, data: xpert) {
    try {
      const xpert = await this.prisma.xpert.findUnique({
        where: {
          email,
        },
      });
      if (Object.keys(!xpert ? {} : xpert).length === 0) {
        return;
      }
      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);
      const sso = {
        method: 'PUT',
        url: this.config.get('MODIFY_XPERT').replace('{email}', email),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
        data,
      };
      await axios(sso);

      const update = await this.prisma.xpert.update({
        where: {
          email,
        },
        data: {
          ...data,
        },
      });
      return APIResponse.successResponse(update, HttpStatus.OK, DATA_CREATED);
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async revoke_xpert(user: string) {
    try {
      const permissions = await this.prisma.permission.findFirst({
        where: {
          xpertEmail: user,
        },
      });

      if (!permissions) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'User has no permissions',
        });
      }

      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);

      const sso = {
        method: 'PATCH',
        url: this.config.get('REVOKE_ACCESS'),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
        data: { user: user },
      };

      await axios(sso);

      const update_sp = await this.prisma.permission.updateMany({
        data: {
          is_active: false,
        },
        where: {
          xpertEmail: user,
        },
      });

      logger.info(`Revoked Access For ${user} From Xpert Data Portal`, {
        data: update_sp,
        type: 'Updated',
      });

      return APIResponse.successResponse(
        update_sp,
        HttpStatus.OK,
        DATA_MODIFIED,
      );
    } catch (error) {
      console.log(error.response.data.error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async logs(page: number, pageSize: number) {
    const startIndex = (page - 1) * pageSize;

    const endIndex = page * pageSize;

    const data = getLogs();

    const sorted = data.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).valueOf() - new Date(a.timestamp).valueOf(),
    );

    return APIResponse.successResponse(
      {
        logs: sorted.slice(startIndex, endIndex),

        totalLogs: sorted.length,

        pageInfo: {
          currentPage: page,

          perPage: pageSize,
          hasNextPage: sorted.length > page * pageSize,
        },
      },

      HttpStatus.OK,

      DATA_FETCHED,
    );
  }
}
