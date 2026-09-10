import { Response } from "express";

export interface ApiResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	errors?: any;
}

export const sendResponse = <T>(
	res: Response,
	statusCode: number,
	success: boolean,
	message: string,
	data?: T,
) => {
	return res.status(statusCode).json({
		success,
		message,
		data,
	});
};

export const sendSuccess = <T>(
	res: Response,
	message: string,
	data?: T,
	statusCode = 200,
) => {
	return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (
	res: Response,
	message: string,
	statusCode = 500,
	errors?: any,
) => {
	return res.status(statusCode).json({
		success: false,
		message,
		errors,
	});
};
