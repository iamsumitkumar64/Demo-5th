import { z } from "zod";
import { UserRoleEnum } from "@/firebase/domain/user/enum/user-role/user-role.enum";

export const signupSchema = z
  .object({
    username: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().min(1, "Email is required").email("Must be a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    role: z.nativeEnum(UserRoleEnum),
    manager_uuid: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === UserRoleEnum.EMPLOYEE) {
        return Boolean(data.manager_uuid && data.manager_uuid.trim().length > 0);
      }
      return true;
    },
    {
      message: "Please select your manager",
      path: ["manager_uuid"],
    }
  );

export type SignupSchemaType = z.infer<typeof signupSchema>;
