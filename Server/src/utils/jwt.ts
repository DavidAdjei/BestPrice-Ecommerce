import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";

export interface AuthTokenPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set — check your .env file against .env.example");
}

export const signAuthToken = (userId: string): string => {
  return jwt.sign({ userId } satisfies AuthTokenPayload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
};

export const AUTH_COOKIE_NAME = "auth_token";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};
