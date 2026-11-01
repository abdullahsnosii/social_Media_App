import z from "zod"
import type { confirm_2_step_verification, Confirmation_Login, confirmEmail, enable_2_step_verification, login, requestForgotPasswordCode, resendConfirmEmail, signup, veriryForgotPassword } from "../authentication.validation"


// export interface ISignupDto {
//     username: string;
//     email: string;
//     password: string;
//     confirPassword: string,
//     phone: string
// }



export type SignupDto = z.infer<ReturnType<typeof signup>>  // نفس type الي راجع من validaction هوا هوا 
export type ConfirmEmailDto = z.infer<ReturnType<typeof confirmEmail>>['body'] 
export type ResendConfirmEmailDto = z.infer<ReturnType<typeof resendConfirmEmail>>['body']
export type RequestForgotPasswordCodeDto = z.infer<ReturnType<typeof requestForgotPasswordCode>>['body']
export type Enable_2_step_verificationDto = z.infer<ReturnType<typeof enable_2_step_verification>>['body']
export type Confirm_2_step_verificationDto = z.infer<ReturnType<typeof  confirm_2_step_verification>>['body']
export type Confirmation_LoginDto = z.infer<ReturnType<typeof Confirmation_Login >>['body']
export type LoginDto = z.infer<ReturnType<typeof login >>['body']
export type VeriryForgotPasswordDto = z.infer<ReturnType<typeof veriryForgotPassword>>['body']
