import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { badRequest } from "../utils/AppError.js";

type Source = "body" | "params" | "query";

export const validate = (schema: ZodType, source: Source = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      next(badRequest(message));
      return;
    }
    req[source] = result.data;
    next();
  };
};
