/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  HttpStatus,
  HttpException,
  Inject,
  forwardRef,
  Patch,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SPDtos } from 'src/dtos/service.provider';
import { APIResponse, RequestResponse } from 'src/helpers/api.response';
import { RequestService } from 'src/request/request.service';
import { CREATE_SP } from 'src/constant/request.variable';
import { DATA_CREATED, DATA_FETCHED } from 'src/helpers/api.constants';
import { sp_qery } from '../service_provider/sp.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async sp_permissions(data: sp_qery, q: number) {
    const { page, pageSize, filter } = data;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    try {
      const permission = await this.prisma.permission.findMany({
        skip,
        take,
        where: {
          service_provider_Id: Number(q),
          xpertEmail: {
            contains: data.email,
            mode: 'insensitive',
          },
        },
        include: {
          xpert: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              photo: true,
              squad: true,
              designation: true,
            },
          },

          service_provider: {
            select: {
              image_url: true,
              is_active: true,
              name: true,
              identifier: true,
              id: true,
            },
          },
        },
      });
      const p_count = await this.prisma.permission.count();
      return APIResponse.successResponse(
        {
          nodes: permission,
          totalCount: p_count,
          pageInfo: {
            currentPage: page,
            perPage: pageSize,
            hasNextPage: p_count > page * pageSize,
          },
        },
        HttpStatus.OK,
        DATA_FETCHED,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async sp_permission(data: sp_qery) {
    const { page, pageSize, filter } = data;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    try {
      const permission = await this.prisma.xpert.findMany({
        skip,
        take,
        where: filter,
        include: {
          permission: {
            select: {
              is_active: true,
              date_added: true,
              xpertEmail: true,
              service_provider: {
                select: {
                  image_url: true,
                  is_active: true,
                  name: true,
                  identifier: true,
                  id: true,
                },
              },
            },
          },
        },
      });
      const p_count = await this.prisma.permission.count();
      return APIResponse.successResponse(
        {
          nodes: permission,
          totalCount: p_count,
          pageInfo: {
            currentPage: page,
            perPage: pageSize,
            hasNextPage: p_count > page * pageSize,
          },
        },
        HttpStatus.OK,
        DATA_FETCHED,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async get_user_permissions(user_id: number) {
    try {
      const user_permissions = await this.prisma.xpert.findUnique({
        where: {
          id: Number(user_id),
        },
        include: {
          permission: {
            select: {
              id: true,
              is_active: true,
              date_added: true,
              xpertEmail: true,
              service_provider: {
                select: {
                  image_url: true,
                  is_active: true,
                  name: true,
                  identifier: true,
                  id: true,
                },
              },
            },
          },
        },
      });
      return APIResponse.successResponse(
        user_permissions,
        HttpStatus.OK,
        DATA_FETCHED,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
