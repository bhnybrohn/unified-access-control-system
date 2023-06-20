/* eslint-disable @typescript-eslint/ban-types */
export interface sp_qery {
  page: number;
  pageSize: number;
  // filter: {},
  is_active: boolean;
  name: string;

  filter: {};

  squad: string;

  email: string;
}
