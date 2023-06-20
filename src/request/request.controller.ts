/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Req, Param, Put } from '@nestjs/common';
import { RequestService } from './request.service';
import {
  ModifyPermissionsDTOs,
  PermissionDTos,
  SPDtos,
  ToggleDtos,
} from '../dtos/service.provider';

@Controller('api/request')
export class RequestController {
  constructor(private readonly requests: RequestService) {}
  @Post('manual_process')
  async process_request_manually(@Body() data: { request_id: string }) {
    return await this.requests.process_request(data.request_id);
  }
  @Post('sp/create')
  async create_service_provider_request(
    @Body() data: SPDtos,
    @Req() req: Request | any,
  ) {
    return await this.requests.create_service_provider_request(
      data,
      req.user.id,
    );
  }
  @Post('permission/create')
  async create_permissions(
    @Body() data: PermissionDTos,
    @Req() req: Request | any,
  ) {
    return await this.requests.create_permissions(data, req.user.id);
  }
  @Post('sp_toggle')
  async toggle_sp(@Body() data: ToggleDtos, @Req() req: Request | any) {
    return await this.requests.create_toggle_sp_status(data.id, req.user.id);
  }
  @Post('permission/modify')
  async modify_permission(
    @Body() data: ModifyPermissionsDTOs,
    @Req() req: Request | any,
  ) {
    return await this.requests.modify_xpert_permissions(data, req.user.id);
  }

  @Put('sp/edit/:id')
  async edit_sp(
    @Body() data: SPDtos,
    @Req() req: Request | any,
    @Param() param: { id: number },
  ) {
    data.id = Number(param.id);
    return await this.requests.edit_sps(data, req.user.id);
  }
  @Put('xpert/revoke_access')
  async revoke_access(
    @Req() req: Request | any,
    @Body() body: { email: string },
  ) {
    return await this.requests.revote_access(body.email, req.user.id);
  }
}
