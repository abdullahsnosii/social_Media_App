import type mongoose from "mongoose";
import type { AccountStatusEnum,  GenderEnum, ProviderEnum, RoleEnum } from "../enum/user.enum.js";



export interface IUser {
   status:AccountStatusEnum;
   ChangeStatusAt:Date;
   _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    password: string;
    phone?: String;
    DOB?: string;
    confirmEmail?: string;

    image?: string;
    coverImage?: string[];
    isPrivate?: boolean;
    gender: GenderEnum
    role: RoleEnum
    provider: ProviderEnum
    changeCredentialsTime: Date;
    twoStepVerification: Date


};



