/* eslint-disable prettier/prettier */
import { createLogger, transports, format } from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { ConsoleLogger } from '@nestjs/common';

const logger = createLogger({
  transports: [
    new transports.File({
      level: 'info',
      filename: 'info.log',
      format: format.combine(format.json()),
    }),
  ],
  format: format.combine(format.metadata(), format.timestamp()),
});

const getLogs = () => {
  try {
    const file = path.join(__dirname, '../../info.log');

    const logs = fs.readFileSync(file, 'utf8');

    const data = logs
      .split('\n')
      .map((data) => {
        return data.split('\r');
      })
      .flat()
      .filter((x) => x != '')
      .map((data) => {
        return JSON.parse(data);
      });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export { logger, getLogs };
