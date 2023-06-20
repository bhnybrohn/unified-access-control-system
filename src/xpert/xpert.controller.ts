/* eslint-disable prettier/prettier */
import {
  Controller,
  Body,
  Post,
  Get,
  Req,
  Query,
  Put,
  Param,
  Patch,
} from '@nestjs/common';
import { XpertService } from './xpert.service';
import { sp_qery } from 'src/service_provider/sp.interface';
import { xpert } from '@prisma/client';

@Controller('api/xpert/')
export class XpertController {
  constructor(private readonly Xpert: XpertService) {}
  @Post('sign_in')
  async XpertSignIn(@Body() data: { session_id: string }) {
    return await this.Xpert.XpertSignIn(data.session_id);
  }
  @Post('sign_out')
  async XpertSignOut(@Body() data: { email: string }) {
    return await this.Xpert.XpertSignOut(data.email);
  }
  @Get('')
  async XpertDetail(@Req() req: Request | any) {
    return await this.Xpert.GetXpert(req.user);
  }
  @Get('logs')
  async logs(@Query() data: sp_qery) {
    return await this.Xpert.logs(data.page, data.pageSize);
  }
  @Put('/:email')
  async edit_xpert(@Param() data: { email: string }, @Body() body: xpert) {
    return await this.Xpert.edit_xpert(data.email, body);
  }
  @Patch('/revoke/:email')
  async revoke_access(@Param() data: { email: string }) {
    return await this.Xpert.revoke_xpert(data.email);
  }
}
