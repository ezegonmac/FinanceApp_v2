import { z } from "zod";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_USER_EMAIL: z.string().email("AUTH_USER_EMAIL must be a valid email"),
  AUTH_USER_PASSWORD: z.string().min(1, "AUTH_USER_PASSWORD is required"),
});

export const env = envSchema.parse(process.env);
