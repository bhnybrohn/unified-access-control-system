/* eslint-disable prettier/prettier */
import {
  Controller,
  Param,
  Patch,
  Post,
  Get,
  Query,
  Req,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceProviderService } from './service_provider.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/utils/file.upload.services';
import { REPLCommand } from 'repl';
import { sp_qery } from './sp.interface';
import { AssignDTos } from '../dtos/service.provider';

@Controller('api/service-provider')
export class ServiceProviderController {
  constructor(private readonly Serivces: ServiceProviderService) {}

  @Patch('/:sp_id')
  @UseInterceptors(FileInterceptor('photo', storage))
  async upload_sp_images(
    @UploadedFile() file: any,
    @Param() param: { sp_id: number },
    @Req() req: Request | any,
  ) {
    if (!file) {
      throw new UnprocessableEntityException(['Provide an image for upload']);
    }

    const fullUrl = req.protocol + '://' + req.get('host');
    const file_name = file.filename;
    const q: string = fullUrl + '/uploads/sp_images/' + file_name;
    return await this.Serivces.upload_sp_images(q, Number(param.sp_id));
  }

  @Get('all')
  async service_provider(@Query() data: sp_qery) {
    data.filter = {};
    if (data.name) {
      data.filter['name'] = {
        contains: data.name,
        mode: 'insensitive',
      };
    }
    if (data.is_active) {
      data.filter['is_active'] = Boolean(Number(data.is_active));
    }
    return await this.Serivces.service_providers(data);
  }
  @Get('/:sp_id')
  async one_sp(@Param() data: { sp_id: number }) {
    return await this.Serivces.service_provider(data.sp_id);
  }
  // @Patch("xpert_to_sp")
  // async add_xpert_to_service(data:AssignDTos){

  // }
  @Get('dashboard/data')
  async dashboard() {
    return await this.Serivces.dashboard();
  }
}
