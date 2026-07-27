import { z } from "zod";

export const budgetTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title is too long");

export const budgetStartDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const debtNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name is too long");

export const uuidSchema = z.string().uuid();
