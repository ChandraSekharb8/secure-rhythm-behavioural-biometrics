import { z } from "zod";

export const createProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().min(2, "Email or username is required").max(255),
  avgDwell: z.number().finite().min(0).max(5000),
  avgFlight: z.number().finite().min(0).max(5000),
  tolerance: z.number().finite().min(1).max(1000).default(40),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a hex value like #00d2d3")
    .default("#00d2d3"),
  fallbackPassword: z
    .string()
    .min(8, "Fallback password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Fallback password must contain at least one letter")
    .regex(/[0-9]/, "Fallback password must contain at least one number"),
});
