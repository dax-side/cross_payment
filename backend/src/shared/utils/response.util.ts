import { Response } from 'express';

/**
 * Response message structure
 */
interface ResponseMessage {
  statusCode: number;
  message: string;
}

/**
 * Send a standardized success response
 * @param res - Express response 
 * @param responseMessage - Success message with status code
 * @param data - Optional data to include in the response
 */
export const sendSuccess = (
  res: Response,
  responseMessage: ResponseMessage,
  data?: any
): void => {
  res.status(responseMessage.statusCode).json({
    success: true,
    message: responseMessage.message,
    data,
  });
};
