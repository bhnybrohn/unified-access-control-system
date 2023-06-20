/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prettier/prettier */
import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  current_time,
  diff_minutes,
  expiration_time,
  genRanHex,
} from 'src/utils/generators';
import { Prisma, Request, request } from '@prisma/client';
import {
  ModifyPermissionsDTOs,
  PermissionDTos,
  SPDtos,
} from 'src/dtos/service.provider';
import { APIResponse, RequestResponse } from 'src/helpers/api.response';
import {
  CONNECT_XPERT,
  CREATE_SP,
  EDIT_SP,
  MODIFY_PERMISSION,
  REVOKE_ACCESS,
  TOGGLE_SP,
} from 'src/constant/request.variable';
import {
  DATA_CREATED,
  DATA_MODIFIED,
  EXIPIRATION_TIME,
} from 'src/helpers/api.constants';
import axios, { Axios, AxiosResponse } from 'axios';
import CryptoJS, { SHA256, enc } from 'crypto-js';
import { base64encode, base64decode } from 'nodejs-base64';
import { logger } from 'src/logger';
@Injectable()
export class RequestService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  async create_service_provider_request(data: SPDtos, xpert: number) {
    try {
      const check_sp = await this.prisma.service_provider.findUnique({
        where: {
          name: data.name,
        },
      });

      if (check_sp) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'a service provider with the name already exists',
        });
      }
      const check_url = await this.prisma.service_provider.findMany({
        where: {
          url: {
            hasSome: data.url,
          },
        },
      });
      //vailidate url
      // const urlPattern =
      //   /^(?:(?:https?):\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

      // const invalid_mail = data.url.filter((url) => {
      //   if (!urlPattern.test(url)) {
      //     return url;
      //   }
      // });
      // if (invalid_mail.length > 0) {
      //   return APIResponse.errorResponse({
      //     statusCode: HttpStatus.FORBIDDEN,
      //     message:
      //       'following url provided are not valid ' + `${[invalid_mail]}`,
      //   });
      // }

      if (check_url.length > 0) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'A similar url has already been assigned to another service provider',
        });
      }
      const create_request = await this.create_request(
        CREATE_SP,
        JSON.stringify(data),
        xpert,
        data,
      );

      if (create_request)
        return RequestResponse.created({
          type: CREATE_SP,
          apiStatusCode: HttpStatus.OK,
          requestId: create_request.request_identifier,
          error: false,
        });
    } catch (error) {
      return RequestResponse.created({
        type: CREATE_SP,
        apiStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: '',
        error: true,
        message: error.message,
      });
    }
  }
  async process_service_provider_request(entities: string) {
    try {
      const d: SPDtos = JSON.parse(entities);

      const check_sp = await this.prisma.service_provider.findUnique({
        where: {
          name: d.name,
        },
      });

      //TODO: make url unique
      if (check_sp) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'a service provider with the name already exists',
        });
      }
      const check_url = await this.prisma.service_provider.findMany({
        where: {
          url: {
            hasSome: d.url,
          },
        },
      });
      // console.log(check_url)
      if (check_url.length > 0) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'A similar url has already been assigned to another service provider',
        });
      }
      const identifier = genRanHex(10);
      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);

      const sso = {
        method: 'POST',
        url: this.config.get('CREATE_SP_URL'),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
        data: { name: d.name, sp_urls: d.url, identifier },
      };
      const from_sso = await axios(sso);

      //Todo: From SSO
      const new_sp = await this.prisma.service_provider.create({
        data: {
          name: d.name,
          url: d.url,
          identifier,
          from_sso: JSON.stringify({
            pk: base64encode(from_sso?.data?.data?.identity_token),
            sk: base64encode(from_sso?.data?.data?.hashed_token),
          }),
        },
      });
      logger.info(`Created a service provider, ${d.name}`, {
        data: d,
        type: 'Created',
      });
      return APIResponse.successResponse(
        new_sp,
        HttpStatus.CREATED,
        DATA_CREATED,
      );
    } catch (error) {
      console.log(error.message);
      throw new HttpException(
        'Service Unavailable, please try again later ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async create_permissions(data: PermissionDTos, xpert: number) {
    try {
      console.log(data);
      const resolves = [];
      for (const sp of data.service_providers) {
        for (const user of data.users) {
          const check_permission = this.prisma.permission.findMany({
            where: {
              service_provider_Id: sp,
              xpertEmail: user.email,
            },
            include: {
              service_provider: {
                select: {
                  name: true,
                  image_url: true,
                },
              },
            },
          });
          resolves.push(check_permission);
        }
      }
      const resolved_promises = await Promise.all(resolves);
      if (resolved_promises.flat().length > 0) {
        return APIResponse.errorResponse({
          data: resolved_promises.flat(),
          statusCode: HttpStatus.FORBIDDEN,
          message: 'these permissions already exists',
        });
      }
      const create_request = await this.create_request(
        CONNECT_XPERT,
        JSON.stringify(data),
        xpert,
        data,
      );
      if (create_request)
        return RequestResponse.created({
          type: CREATE_SP,
          apiStatusCode: HttpStatus.OK,
          requestId: create_request.request_identifier,
          error: false,
        });
    } catch (error) {
      throw new HttpException(
        `Error:${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async get_sps_id(id_s: number[]) {
    const sps = await this.prisma.service_provider.findMany({
      where: {
        id: {
          in: id_s,
        },
      },
      select: {
        identifier: true,
      },
    });
    return Object.values(sps);
  }
  async process_permission_request(entities: string) {
    try {
      const d: PermissionDTos = JSON.parse(entities);

      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);
      const sso_ids = await this.get_sps_id(d.service_providers);
      console.log([sso_ids]);
      // const identifier =
      //   (Array.from({ length: sso_ids.length }),
      //   () => genRanHex(10).toUpperCase());

      const sso = {
        method: 'POST',
        url: this.config.get('MODIFY_PERMISSION_URL'),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
        data: {
          users: d.users,
          service_providers: [...sso_ids.map((q) => Object.values(q))].flat(),
        },
      };
      await axios(sso);

      const resolves = [];
      for (const sp of d.service_providers) {
        for (const user of d.users) {
          const check_user = await this.prisma.xpert.findUnique({
            where: {
              email: user.email,
            },
          });
          console.log(check_user);
          if (!check_user) {
            const create_xpert = await this.prisma.xpert.create({
              data: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                middle_name: user.middle_name,
                squad: user.squad,
                designation: user.designation,
                photo: user.photo,
                work_id:user.work_id
              },
            });
            if (create_xpert) {
              const create_permission = this.prisma.permission.create({
                data: {
                  xpert: {
                    connect: {
                      email: user.email,
                    },
                  },
                  service_provider: {
                    connect: {
                      id: sp,
                    },
                  },
                },
              });
              resolves.push(create_permission);
            }
          }
          if (check_user) {
            const create_permission = this.prisma.permission.create({
              data: {
                xpert: {
                  connect: {
                    email: user.email,
                  },
                },
                service_provider: {
                  connect: {
                    id: sp,
                  },
                },
              },
            });
            resolves.push(create_permission);
          }
        }
      }
      const resolved_promises = await Promise.all(resolves);

      logger.info(`New Xperts Permissions Added`, {
        data: resolved_promises.flat(),
        type: 'Created',
      });

      return APIResponse.successResponse(
        resolved_promises.flat(),
        HttpStatus.CREATED,
        DATA_CREATED,
      );
    } catch (error) {
      console.log(error.response.data.error);
      throw new HttpException(
        error?.response?.data ?? error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async create_request(
    request_type: Request,
    Entity: string,
    xpert: number,
    data?: any,
  ): Promise<request> {
    console.log(request_type, Entity, xpert);
    try {
      const request_identifier = 'RQ' + genRanHex(30).toUpperCase();
      console.log(expiration_time, current_time);
      const r_obj = await this.prisma.request.create({
        data: {
          request_type,
          expires_in: expiration_time,
          request_identifier,
          entities: Entity,
          xpert: {
            connect: {
              id: xpert,
            },
          },
        },
      });

      return r_obj;
    } catch (error) {
      throw new HttpException(`Error:${error}`, HttpStatus.UNAUTHORIZED);
    }
  }
  async request_type(request_type: string, entities: string) {
    return request_type === 'CREATE_SP'
      ? await this.process_service_provider_request(entities)
      : request_type === 'CONNECT_XPERT'
      ? await this.process_permission_request(entities)
      : request_type === 'TOGGLE_SP'
      ? await this.process_toggle_sp_status(entities)
      : request_type === 'MODIFY_PERMISSION'
      ? await this.process_xpert_permissions(entities)
      : request_type === 'EDIT_SP'
      ? await this.process_edit_sps(entities)
      : request_type === 'REVOKE_ACCESS'
      ? await this.process_revoke(entities)
      : '';
  }
  async process_request(request_id: string) {
    try {
      const request = await this.prisma.request.findUnique({
        where: {
          request_identifier: request_id,
        },
      });
      if (!request) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Invalid Request',
        });
      }
      if (request.processed) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Request Already Processed',
        });
      }
      console.log(
        'expires',
        diff_minutes(new Date(request.expires_in)),
        'minutes',
      );
      await this.prisma.request.update({
        where: {
          request_identifier: request_id,
        },
        data: {
          processed: true,
        },
      });
      if (diff_minutes(new Date(request.expires_in)) > EXIPIRATION_TIME) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Request Expired',
        });
      }
      //process request
      return await this.request_type(request.request_type, request.entities);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async create_toggle_sp_status(sp_id: number, xpert: number) {
    try {
      const sp = await this.prisma.service_provider.findUnique({
        where: {
          id: Number(sp_id),
        },
      });
      if (!sp) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Invalid Service Provider Id',
        });
      }

      const create_request = await this.create_request(
        TOGGLE_SP,
        JSON.stringify(sp_id),
        xpert,
        sp_id,
      );

      if (create_request)
        return RequestResponse.created({
          type: TOGGLE_SP,
          apiStatusCode: HttpStatus.OK,
          requestId: create_request.request_identifier,
          error: false,
        });
    } catch (error) {
      return RequestResponse.created({
        type: TOGGLE_SP,
        apiStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: '',
        error: true,
        message: error.message,
      });
    }
  }
  async process_toggle_sp_status(entities: string) {
    const sp_id = Number(entities);

    try {
      const sp = await this.prisma.service_provider.findUnique({
        where: {
          id: Number(sp_id),
        },
      });
      //
      if (!sp) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Invalid Service Provider Id',
        });
      }
      const update_sp = await this.prisma.service_provider.update({
        data: {
          is_active: !sp.is_active,
        },
        where: {
          id: Number(sp_id),
        },
      });

      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);
      const sso_ids = await this.get_sps_id([Number(sp_id)]);

      const sso = {
        method: 'PATCH',
        url: this.config
          .get('MODIFY_SP_URL')
          .replace('{id}', [...sso_ids.map((q) => Object.values(q))].flat()[0]),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
      };
      console.log(sso);
      await axios(sso);

      logger.info(`Set ${sp.name} Status to ${!sp.is_active}`, {
        data: {},
        type: 'Updated',
      });

      return APIResponse.successResponse(
        update_sp,
        HttpStatus.OK,
        DATA_MODIFIED,
      );
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async modify_xpert_permissions(data: ModifyPermissionsDTOs, xpert: number) {
    try {
      const create_request = await this.create_request(
        MODIFY_PERMISSION,
        JSON.stringify(data),
        xpert,
        data,
      );

      if (create_request)
        return RequestResponse.created({
          type: MODIFY_PERMISSION,
          apiStatusCode: HttpStatus.OK,
          requestId: create_request.request_identifier,
          error: false,
        });
    } catch (error) {
      return RequestResponse.created({
        type: MODIFY_PERMISSION,
        apiStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: '',
        error: true,
        message: error.message,
      });
    }
  }
  async process_xpert_permissions(entities: string) {
    try {
      const d: ModifyPermissionsDTOs = JSON.parse(entities);

      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);

      const sso = {
        method: 'PATCH',
        url: this.config.get('TOGGLE_PERMISSION_URL'),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
        data: d,
      };

      await axios(sso);

      const resolves = [];
      for (const obj of d.data) {
        console.log(Boolean(obj.status));
        const permission_update = this.prisma.permission.update({
          where: {
            id: obj.id,
          },
          data: {
            is_active: Boolean(obj.status),
          },
        });
        resolves.push(permission_update);
      }

      const resolved_promises = await Promise.all(resolves);
      console.log(resolved_promises.flat());

      if (resolved_promises.flat().length > 0) {
        return APIResponse.successResponse(
          resolved_promises.flat(),
          HttpStatus.OK,
          DATA_MODIFIED,
        );
      }
      logger.info(`Modified Xpert Permission `, {
        data: resolved_promises,
        type: 'Updated',
      });
    } catch (error) {
      console.log(error.response.data.error);
      throw new HttpException(
        'Service Unavailable, please try again later ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async edit_sps(data: SPDtos, xpert: number) {
    try {
      const get_sps = await this.prisma.service_provider.findUnique({
        where: {
          id: data.id,
        },
      });
      const intersection = data.url.filter((sp) => !get_sps.url.includes(sp));
      console.log(intersection, get_sps.url, data.url);
      if (intersection.length > 0) {
        const check_url = await this.prisma.service_provider.findMany({
          where: {
            url: {
              hasSome: intersection,
            },
          },
        });
        // console.log(check_url)
        if (check_url.length > 0) {
          return APIResponse.errorResponse({
            statusCode: HttpStatus.FORBIDDEN,
            message:
              'A similar url has already been assigned to another service provider,' +
              ' ' +
              intersection,
          });
        }
      }

      const create_request = await this.create_request(
        EDIT_SP,
        JSON.stringify(data),
        xpert,
        data,
      );

      if (create_request)
        return RequestResponse.created({
          type: EDIT_SP,
          apiStatusCode: HttpStatus.OK,
          requestId: create_request.request_identifier,
          error: false,
        });
    } catch (error) {
      return RequestResponse.created({
        type: EDIT_SP,
        apiStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: '',
        error: true,
        message: error.message,
      });
    }
  }
  async process_edit_sps(entities: string) {
    try {
      const d: SPDtos = JSON.parse(entities);

      const sso_pk = this.config.get('SSO_PK');
      const sso_sk = this.config.get('SSO_SK');
      const hash_value = sso_pk + sso_sk + Date.now();
      const digest = SHA256(hash_value).toString(enc.Hex);
      const sso_ids = await this.get_sps_id([Number(d.id)]);

      const check_name = await this.prisma.service_provider.findUnique({
        where: {
          id: d.id,
        },
      });
      //todo: name update
      const sso = {
        method: 'PUT',
        url: this.config.get('EDIT_SP'),
        headers: {
          'api-key': sso_pk,
          'hash-key': digest,
          'request-ts': Date.now(),
        },
        data: {
          name: check_name.name === d.name ? '' : d.name,
          sp_urls: d.url,
          identifier: [...sso_ids.map((q) => Object.values(q))].flat()[0],
        },
      };
      await axios(sso);

      const update_sp = await this.prisma.service_provider.update({
        where: {
          id: d.id,
        },
        data: {
          name: d.name,
          url: d.url,
        },
      });

      logger.info(`Modified Service Provider, ${d.name} `, {
        data: update_sp,
        type: 'Updated',
      });
      return APIResponse.successResponse(
        update_sp,
        HttpStatus.CREATED,
        DATA_CREATED,
      );
    } catch (error) {
      console.log(error.response.data.error);
      throw new HttpException(
        'Service Unavailable, please try again later ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async revote_access(data: string, xpert: number) {
    try {
      const permissions = await this.prisma.permission.findFirst({
        where: {
          xpertEmail: data,
        },
      });
      if (!permissions) {
        return APIResponse.errorResponse({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'User has no permissions',
        });
      }
      const create_request = await this.create_request(
        REVOKE_ACCESS,
        JSON.stringify(data),
        xpert,
        data,
      );

      if (create_request)
        return RequestResponse.created({
          type: REVOKE_ACCESS,
          apiStatusCode: HttpStatus.OK,
          requestId: create_request.request_identifier,
          error: false,
        });
    } catch (error) {
      return RequestResponse.created({
        type: REVOKE_ACCESS,
        apiStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: '',
        error: true,
        message: error.message,
      });
    }
  }
  async process_revoke(entities: string) {
    const user = JSON.parse(entities);
    console.log(user);
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

      logger.info(`Revoked Access For ${user} `, {
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
  async get_sso_ids_from_permissions() {}
  async requst_by_user() {}
}

/*
TODO: activities
 - status changes on sso 
 */
