/* eslint-disable prettier/prettier */
class APIResponse {
  static successResponse(
    data: any,
    statusCode: number,
    type?: string,
  ): {
    statusCode: number;
    success: boolean;
    message: string;
    data: any;
  } {
    return {
      statusCode,
      success: true,
      message: type === 'POST' ? 'Data Retrieved' : 'Data Fetched',
      data,
    };
  }
  static errorResponse(data: {
    data?: any;
    statusCode?: number;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type?: string;
    message?: string;
  }): {
    statusCode: number;
    success: boolean;
    error: string;
    data: any;
  } {
    return {
      statusCode: data.statusCode,
      success: false,
      error: data.message,
      data: data.data,
    };
  }
}

class RequestResponse {
  static created(data: {
    type: string;
    apiStatusCode: number;
    requestId: string;
    error: boolean;
    message?: string;
  }): {
    type: string;
    apiStatusCode: number;
    requestId: string;
    error: boolean;
  } {
    return data;
  }
}
export { APIResponse, RequestResponse };
