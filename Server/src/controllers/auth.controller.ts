import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from "../utils/jwt.js";
import { AppError, badRequest, conflict, forbidden, notFound, unauthorized } from "../utils/AppError.js";
import { toPublicUser } from "../utils/serialize.js";
import { exchangeGoogleCode, getGoogleUser } from "../utils/googleOAuth.js";
import { createPaystackSubaccount, listBanks } from "../utils/paystack.js";
import { uploadBuffer } from "../utils/cloudinary.js";
import { requireParam } from "../utils/params.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/mailer.js";

const toRole = (role: string): Role => (role.toUpperCase() as Role);
const generateToken = () => randomBytes(32).toString("hex");

export const signUp = asyncHandler(async (req: Request, res: Response) => {
  const { step, role, credentials } = req.body;

  if (step === 1) {
    const { firstName, lastName, email, password, dateOfBirth } = credentials;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict("An account with this email already exists");

    const hashedPassword = await hashPassword(password);
    const registrationStep = role === "seller" ? 2 : 0;
    const verificationToken = generateToken();

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: toRole(role),
        dateOfBirth,
        registrationStep,
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (error) {
      // Don't fail signup just because the email provider hiccuped —
      // the user can request another verification email later.
      console.error("Failed to send verification email:", error);
    }

    res.status(201).json({ message: "Basic information saved", user: toPublicUser(user) });
    return;
  }

  // step === 2, seller payment details
  const { user: userRef, paymentInfo } = credentials;
  const existingUser = await prisma.user.findUnique({ where: { id: userRef.id } });
  if (!existingUser || existingUser.registrationStep !== 2) {
    throw badRequest("Invalid step sequence");
  }

  const subaccountCode = await createPaystackSubaccount(
    `${existingUser.firstName} ${existingUser.lastName}`,
    paymentInfo
  );

  await prisma.$transaction(async (tx) => {
    await tx.paymentMethod.create({
      data: {
        userId: existingUser.id,
        provider: paymentInfo.provider,
        accountNumber: paymentInfo.accountNumber,
        expiryDate: paymentInfo.expiryDate,
      },
    });

    if (paymentInfo.billingAddress) {
      await tx.address.upsert({
        where: { userId: existingUser.id },
        create: { userId: existingUser.id, ...paymentInfo.billingAddress },
        update: paymentInfo.billingAddress,
      });
    }

    await tx.user.update({
      where: { id: existingUser.id },
      data: { paystackSecret: subaccountCode, registrationStep: 0 },
    });
  });

  res.status(201).json({ message: "Seller registration complete", nextStep: null });
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email }, include: { address: true } });
  if (!user) throw notFound("User");
  if (!user.password) throw unauthorized("This account uses Google sign-in");

  const match = await comparePassword(password, user.password);
  if (!match) throw new AppError("Password is incorrect", 403);

  if (user.accountStatus !== "ACTIVE") {
    throw forbidden(
      user.accountStatus === "SUSPENDED"
        ? "This account has been suspended. Contact support for help."
        : "This account is no longer available."
    );
  }

  const token = signAuthToken(user.id);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
  res.json({ user: toPublicUser(user) });
});

export const loginWithGoogle = asyncHandler(async (req: Request, res: Response) => {
  const { code, role } = req.query as { code?: string; role?: string };
  if (!code) throw badRequest("Authorization code is required");

  const { id_token, access_token } = await exchangeGoogleCode(code);
  const googleUser = await getGoogleUser(id_token, access_token);

  let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

  if (user) {
    const token = signAuthToken(user.id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.redirect(`${process.env.CLIENT_SIDE_URL}/dashboard`);
    return;
  }

  if (!role) throw badRequest("User role is required for new accounts");

  user = await prisma.user.create({
    data: {
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      verified: googleUser.email_verified,
      role: toRole(role),
      registrationStep: role === "seller" ? 2 : 0,
    },
  });

  const token = signAuthToken(user.id);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
  res.redirect(`${process.env.CLIENT_SIDE_URL}/complete-profile`);
});

export const isAuth = asyncHandler(async (req: Request, res: Response) => {
  // requireAuth middleware already verified the token and set req.userId
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { address: true },
  });
  if (!user) throw notFound("User");

  if (user.registrationStep !== 0) {
    res.status(400).json({ error: "Registration incomplete", user: toPublicUser(user) });
    return;
  }

  res.json({ message: "Authenticated", user: toPublicUser(user) });
});

export const editUser = asyncHandler(async (req: Request, res: Response) => {
  const { credentials } = req.body;
  const id = requireParam(req.params.id, "id");

  const user = await prisma.user.update({ where: { id }, data: credentials });
  if (!user) throw notFound("User");

  res.json({ message: "User updated successfully" });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const address = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound("User");

  await prisma.address.upsert({
    where: { userId: id },
    create: { userId: id, ...address },
    update: address,
  });

  const updated = await prisma.user.findUnique({ where: { id }, include: { address: true } });
  res.json({ message: "Address added", user: toPublicUser(updated!) });
});

export const editImage = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const file = req.file;
  if (!file) throw badRequest("No file uploaded");

  const imageUrl = await uploadBuffer(file.buffer);

  const user = await prisma.user.update({ where: { id }, data: { imageUrl } });
  if (!user) throw notFound("User");

  res.json({ message: "Image uploaded successfully" });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
  res.json({ message: "Logout successful" });
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireParam(req.params.userId, "userId");
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ notifications });
});

export const getBanks = asyncHandler(async (_req: Request, res: Response) => {
  const banks = await listBanks();
  res.json({ banks });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) throw badRequest("Verification token is required");

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
    throw badRequest("This verification link is invalid or has expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verificationToken: null, verificationTokenExpiry: null },
  });

  res.json({ message: "Email verified successfully" });
});

export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw notFound("User");
  if (user.verified) {
    res.json({ message: "This account is already verified" });
    return;
  }

  const verificationToken = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  await sendVerificationEmail(user.email, user.firstName, verificationToken);

  res.json({ message: "Verification email sent" });
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond with the same message whether or not the account
  // exists — otherwise this endpoint becomes a way to enumerate which
  // emails have accounts.
  if (user && user.password) {
    const resetToken = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    });
    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  if (!token || !password) throw badRequest("Token and new password are required");

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw badRequest("This reset link is invalid or has expired");
  }

  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ message: "Password updated — you can now log in" });
});
