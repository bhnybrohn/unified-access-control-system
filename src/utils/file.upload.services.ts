/* eslint-disable prettier/prettier */
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { Injectable, UnprocessableEntityException } from '@nestjs/common';

const whitelist = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const storage = {
  storage: diskStorage({
    destination: './uploads/sp_images',
    filename: (req, file, cb) => {
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;

      cb(null, `${filename}${extension}`);
    },
    // fileFilter: (req, file, cb) => {
    //   if (!whitelist.includes(file.mimetype)) {
    //     return cb(new Error('file is not allowed'));
    //   }
    //   cb(null, true);
    // },
  }),
};
