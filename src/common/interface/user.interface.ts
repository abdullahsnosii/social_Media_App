import type { GenderEnum, ProviderEnum, RoleEnum } from "../enum/user.enum.js";



export interface IUser {
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    password: string;
    phone?: String;
    DOB?: string;
    confirmEmail?: string;

    image?: String;
    coverImage?: [String];
    isPrivate?: boolean;
    gender: GenderEnum
    role: RoleEnum
    provider: ProviderEnum
    changeCredentialsTime: Date;
    twoStepVerification: Date


};



