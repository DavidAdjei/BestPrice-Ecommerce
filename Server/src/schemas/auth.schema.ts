import { z } from "zod";

export const roleSchema = z.enum(["buyer", "seller"]);

export const signUpStep1Schema = z.object({
  step: z.literal(1),
  role: roleSchema,
  credentials: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    dateOfBirth: z.coerce.date().optional(),
  }),
});

export const signUpStep2Schema = z.object({
  step: z.literal(2),
  role: z.literal("seller"),
  credentials: z.object({
    user: z.object({ id: z.string() }),
    paymentInfo: z.object({
      provider: z.string().min(1, "Bank/provider is required"),
      accountNumber: z.string().min(1, "Account number is required"),
      expiryDate: z.coerce.date().optional(),
      billingAddress: z
        .object({
          city: z.string(),
          region: z.string(),
          street: z.string(),
          houseNumber: z.string(),
          ghanaPost: z.string(),
        })
        .optional(),
    }),
  }),
});

export const signUpSchema = z.discriminatedUnion("step", [signUpStep1Schema, signUpStep2Schema]);

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const addressSchema = z.object({
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region is required"),
  street: z.string().min(1, "Street is required"),
  houseNumber: z.string().min(1, "House number is required"),
  ghanaPost: z.string().min(1, "Ghana Post GPS address is required"),
});

export const editUserSchema = z.object({
  credentials: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    dateOfBirth: z.coerce.date().optional(),
  }),
});
