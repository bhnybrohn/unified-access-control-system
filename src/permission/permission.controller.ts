/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { sp_qery } from '../service_provider/sp.interface';

@Controller('api/permission')
export class PermissionController {
  constructor(private readonly services: PermissionService) {}

  @Get('/:sp_id')
  async permission_list(
    @Query() data: sp_qery,
    @Param() param: { sp_id: number },
  ) {
    return await this.services.sp_permissions(data, param.sp_id);
  }
  @Get('')
  async permissions_list(@Query() data: sp_qery) {
    data.filter = {};
    if (data.name) {
      data.filter['OR'] = [
        {
          first_name: {
            contains: data.name,
            mode: 'insensitive',
          },
        },
        {
          last_name: {
            contains: data.name,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: data.name,
            mode: 'insensitive',
          },
        },
      ];
    }

    return await this.services.sp_permission(data);
  }
  @Get('user/:id')
  async user_permissions(@Param() data: { id: number }) {
    return await this.services.get_user_permissions(data.id);
  }
}
