export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}

export const notFound = (entity: string) => new AppError(`${entity} not found`, 404);
export const unauthorized = (message = "Not authenticated") => new AppError(message, 401);
export const forbidden = (message = "Not allowed") => new AppError(message, 403);
export const badRequest = (message: string) => new AppError(message, 400);
export const conflict = (message: string) => new AppError(message, 409);
