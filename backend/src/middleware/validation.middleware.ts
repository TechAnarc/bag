import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, ZodEffects } from "zod";
import { sendError } from "../utils/response";

export const validate = (schema: AnyZodObject | ZodEffects<any>) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});
			return next();
		} catch (error) {
			if (error instanceof ZodError) {
				return sendError(res, "Validation failed", 400, error.errors);
			}
			return sendError(res, "Internal server error", 500);
		}
	};
};
