import { z } from "zod";
import { ClaimCategoryEnum } from "@/firebase/domain/claim/enum/claim-category/claim-category.enum";

const urlRegex = /^(https?:\/\/)([\w.-]+)+(:\d+)?(\/.*)?$/i;

export const claimSubmitSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(80, "Title must not exceed 80 characters"),
    category: z.nativeEnum(ClaimCategoryEnum, { message: "Category is required", }),
    amount: z.number({ message: "Amount is required" }).positive().gt(0, "Amount must be greater than 0").lte(100000, "Amount cannot exceed 1,00,000"),
    description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000, "Description cannot exceed 5000 characters"),
    receipt_url: z.string().trim().optional().or(z.literal("")),
    expense_date: z.string().min(1, "Expense date is required")
      .refine(
        (val) => {
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return date <= today;
        },
        { message: "Expense date cannot be in the future" }
      )
      .refine(
        (val) => {
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          ninetyDaysAgo.setHours(0, 0, 0, 0);
          return date >= ninetyDaysAgo;
        },
        { message: "Expense date cannot be older than 90 days" }
      ),
  })
  .refine(
    (data) => {
      if (data.amount >= 2000) {
        if (!data.receipt_url || data.receipt_url.trim().length === 0) {
          return false;
        }
        return urlRegex.test(data.receipt_url);
      }
      if (data.receipt_url && data.receipt_url.trim().length > 0) {
        return urlRegex.test(data.receipt_url);
      }
      return true;
    },
    {
      message: "Valid Receipt URL is required when amount is ₹2,000 or more",
      path: ["receipt_url"],
    }
  );

export type ClaimSubmitSchemaType = z.infer<typeof claimSubmitSchema>;

export const claimDraftSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(80, "Title must not exceed 80 characters"),
  category: z.nativeEnum(ClaimCategoryEnum).optional().or(z.literal("")),
  amount: z
    .number()
    .positive()
    .refine((v) => !v || (v > 0 && v <= 100000), "Amount must be between 1 and 1,00,000")
    .optional()
    .nullable(),
  expense_date: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      ninetyDaysAgo.setHours(0, 0, 0, 0);
      return date <= today && date >= ninetyDaysAgo;
    }, "Expense date must not be in the future or older than 90 days")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .refine((val) => !val || (val.length >= 20 && val.length <= 5000), "Description must be between 20 and 5000 characters")
    .optional()
    .or(z.literal("")),
  receipt_url: z
    .string()
    .trim()
    .refine((val) => !val || urlRegex.test(val), "Receipt URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ClaimDraftSchemaType = z.infer<typeof claimDraftSchema>;
