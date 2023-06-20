/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  Validate,
  IsPositive,
  ValidateNested,
  IsArray,
} from 'class-validator';
// import { CustomEmailvalidation } from '../xperts.validators';
import { Type } from 'class-transformer';
import { Prisma, Gender } from '@prisma/client';
import { CustomEmailvalidation } from '../xpert/xperts.validators';
import { IsImageFile, SPvalidation } from '../service_provider/sp.validator';

class user_objDTO {
  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  middle_name: string;

  @IsEmail()
  @Validate(CustomEmailvalidation)
  email: string;

  photo: string;
}

export class AssignSPDtos {
  @ValidateNested({ each: true })
  @Type(() => user_objDTO)
  user: user_objDTO;

  service_provider: number;
}

export class SPDtos {
  @IsNotEmpty()
  @Validate(SPvalidation)
  name: string;

  @IsNotEmpty()
  url: string[];

  @IsImageFile({ message: 'invalid mime type received' })
  image_url: string;

  id: number;
}

class usersPermissionObj {
  @IsNotEmpty()
  first_name: string;

  work_id:string;

  @IsNotEmpty()
  last_name: string;

  middle_name: string;

  @IsNotEmpty()
  @Validate(CustomEmailvalidation)
  email: string;

  gender: string;

  photo: string;

  // @IsNotEmpty()
  squad: string;

  @IsNotEmpty()
  designation: string;
}

export class PermissionDTos {
  @ValidateNested({ each: true })
  @Type(() => usersPermissionObj)
  users: usersPermissionObj[];

  service_providers: number[];
}

export class AssignDTos {
  @ValidateNested({ each: true })
  @Type(() => usersPermissionObj)
  users: usersPermissionObj[];

  service_providers: number;
}

export class ToggleDtos {
  @IsPositive()
  @IsNotEmpty()
  id: number;
}

class PermissionObj {
  @IsPositive()
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  status: number;

  @IsPositive()
  @IsNotEmpty()
  sp_id: number;
}

export class ModifyPermissionsDTOs {
  @IsArray()
  @IsNotEmpty()
  data: PermissionObj[];
}
