import { z } from "zod"

const nameRegex = /^[a-zA-Z\s\-']+$/
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be at most 50 characters")
      .regex(nameRegex, "Letters and spaces only"),
    email: z.string().email("Enter a valid email").transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(passwordRegex, "Include uppercase, number, and special character"),
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine((v) => v === true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").transform((v) => v.toLowerCase().trim()),
})

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp_code: z.string().length(6, "Enter the 6-digit code"),
    new_password: z
      .string()
      .min(8)
      .regex(passwordRegex, "Include uppercase, number, and special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.new_password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpFormValues = z.infer<typeof signUpSchema>
export type SignInFormValues = z.infer<typeof signInSchema>
