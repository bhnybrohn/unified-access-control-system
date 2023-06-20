/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import * as moment from 'moment-timezone';

export const genRanHex = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

export const expiration_time = moment()
  .tz('Africa/Lagos')
  .add(5, 'minute')
  .format();

export const current_time = moment()
  .tz('Africa/Lagos')
  // .subtract(1, 'hour')
  .format();

// console.log(expiration_time, current_time);

export function check_time_diff(b: Date) {
  const a = moment(current_time);
  const request_time = moment(b);

  return request_time.diff(a, 'minutes');
}

export function diff_minutes(dt2: Date) {
  console.log(new Date(current_time), dt2);
  let diff = (new Date(current_time).getTime() - dt2.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}
