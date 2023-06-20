/* eslint-disable prettier/prettier */
import { ValidationOptions, registerDecorator } from 'class-validator';
/* eslint-disable prettier/prettier */
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

export function IsImageFile(options?: ValidationOptions) {
  return (object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(mimeType) {
          const acceptMimeTypes = ['image/png', 'image/jpeg'];
          const fileType = acceptMimeTypes.find((type) => type === mimeType);
          return !fileType;
        },
      },
    });
  };
}

@ValidatorConstraint({ name: 'name', async: true })
@Injectable()
export class SPvalidation implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}
  async validate(value: string): Promise<boolean> {
    if (!value) {
      throw new UnprocessableEntityException([
        'Provide a name for the service provider',
      ]);
    }
    return true;
  }
}
