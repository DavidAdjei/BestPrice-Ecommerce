import { badRequest } from "./AppError.js";

export const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw badRequest(`${name} is required`);
  }
  return value;
};
