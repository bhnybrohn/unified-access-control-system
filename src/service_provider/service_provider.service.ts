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
import { AssignDTos, SPDtos } from 'src/dtos/service.provider';
import { APIResponse, RequestResponse } from 'src/helpers/api.response';
import { RequestService } from 'src/request/request.service';
import { CREATE_SP } from 'src/constant/request.variable';
import { DATA_CREATED, DATA_FETCHED } from 'src/helpers/api.constants';
import { sp_qery } from './sp.interface';

@Injectable()
export class ServiceProviderService {
  constructor(private prisma: PrismaService) {}

  async upload_sp_images(q: string, sp_id: number) {
    try {
      const upload_sp_image = await this.prisma.service_provider.update({
        where: {
          id: sp_id,
        },
        data: {
          image_url: q,
        },
      });
      return APIResponse.successResponse(
        upload_sp_image,
        HttpStatus.CREATED,
        DATA_CREATED,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async service_providers(data: sp_qery) {
    try {
      const { page, pageSize, filter } = data;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const Sps = await this.prisma.service_provider.findMany({
        skip,
        take,
        where: {
          ...filter,
          is_deleted: false,
        },
        select: {
          id: true,
          name: true,
          image_url: true,
          is_active: true,
          identifier: true,
          url: true,
          date_added: true,
          permission: {
            include: {
              xpert: {
                select: {
                  first_name: true,
                  last_name: true,
                  photo: true,
                },
              },
            },
          },
          _count: {
            select: {
              permission: true,
            },
          },
        },
        orderBy: [
          {
            date_added: 'desc',
          },
        ],
      });
      return APIResponse.successResponse(
        {
          nodes: Sps.flat(),
          totalCount: Sps.length,
          pageInfo: {
            currentPage: page,
            perPage: pageSize,
            hasNextPage: Sps.length > page * pageSize,
          },
        },
        HttpStatus.OK,
        DATA_FETCHED,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async service_provider(id: number) {
    try {
      const Sp = await this.prisma.service_provider.findUnique({
        where: {
          id: Number(id),
        },
        select: {
          id: true,
          url: true,
          name: true,
          image_url: true,
          is_active: true,
          date_added: true,
          from_sso: true,
          permission: {
            include: {
              xpert: true,
            },
          },
          _count: {
            select: {
              permission: true,
            },
          },
        },
      });
      return APIResponse.successResponse(Sp, HttpStatus.OK, DATA_FETCHED);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async dashboard() {
    try {
      const sp_count = this.prisma.service_provider.count();
      const q_sp = this.prisma.service_provider.groupBy({
        by: ['is_active'],
        _count: {
          is_active: true,
        },
      });
      const total_xpert = this.prisma.xpert.count();
      const data = await Promise.all([sp_count, q_sp, total_xpert]);
      return APIResponse.successResponse(
        {
          sp_count: data[0],
          active_grouping: data[1],
          total_xpert: data[2],
        },
        HttpStatus.OK,
        DATA_FETCHED,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
