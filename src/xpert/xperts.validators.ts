/* eslint-disable prettier/prettier */
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

@ValidatorConstraint({ name: 'email', async: true })
@Injectable()
export class CustomEmailvalidation implements ValidatorConstraintInterface {
  async validate(value: string): Promise<boolean> {
    if (!value) {
      throw new UnprocessableEntityException(['Provide a valid mail']);
    }
    const split_email = value?.split('@');
    const check =
      split_email[1] !== ('africaexchange.com' || 'afex.africa') ? false : true;
    if (!check) {
      throw new UnprocessableEntityException(['Email must be an AFEX mail']);
    }

    return check;
  }
}

@ValidatorConstraint({ name: 'service_provider', async: true })
@Injectable()
export class SPvalidation implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}
  async validate(value: number): Promise<boolean> {
    if (!value) {
      throw new UnprocessableEntityException(['Provide a Service Provider Id']);
    }
    const check_sp = await this.prisma.xpert.findUnique({
      where: {
        id: value,
      },
    });
    const check = check_sp ? false : true;
    if (!check) {
      throw new UnprocessableEntityException([
        'A service provider with the name already exist',
      ]);
    }
    return check;
  }
}
