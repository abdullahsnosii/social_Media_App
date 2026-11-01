import { z } from "zod"
import { error } from "node:console"
import mongoose from 'mongoose'
import { LanguageEnum } from "../enum/security.enum.js"
import { GenderEnum } from "../enum/user.enum.js"


const validationMessages :Record<number , {ar :string ; en :string}>  = {

    101: {
        ar: "البريد الإلكتروني غير صحيح",
        en: "Invalid email format"
    },

    102: {
        ar: "اسم المستخدم يجب أن يكون حرفين على الأقل",
        en: "Username must be at least 2 characters"
    },

    103: {
        ar: "اسم المستخدم يجب ألا يتجاوز 51 حرفًا",
        en: "Username must not exceed 51 characters"
    },

    104: {
        ar: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        en: "Password must be at least 8 characters"
    },

    105: {
        ar: "كلمة المرور يجب ألا تتجاوز 16 حرفًا",
        en: "Password must not exceed 16 characters"
    },

    106: {
        ar: "رقم الهاتف غير صحيح",
        en: "Invalid phone number"
    },

    107: {
        ar: "النوع غير صحيح",
        en: "Invalid gender"
    },

    108: {
        ar: "اسم المستخدم يجب أن يتكون من جزئين",
        en: "Username must contain 2 parts"
    },

    109: {
        ar: "البيانات غير متطابقة",
        en: "Fields do not match"
    }
}


const getValidationMessages = ({ lang, code }: { lang: LanguageEnum, code: number }) : string => {
    return lang == LanguageEnum.AR ? validationMessages[code]!.ar : validationMessages[code]!.en  // هرجعلها تاني 
}

export const matchFields = ({ original, copy, data, ctx, lang }: { original: string, copy: string, data: any, ctx: z.RefinementCtx, lang: LanguageEnum }) => {
    if (data[original] !== data[copy]) {

        ctx.addIssue({
            code: "custom",
            path: [copy],
            message: getValidationMessages({lang:lang, code:109})
        })

    }

}


export const generalValidationFields = {

    email: (lang:LanguageEnum) =>
        z.email({
            message: getValidationMessages({lang:lang, code:101})
        }),

    otp: (lang:LanguageEnum) => z.string().regex(/^\d{6}$/, { error: "Invalid code" }),

    password: (lang:LanguageEnum) =>
        z.string().regex(/^(?=.*[a-z])(?=.*\s{0,})(?=.*[A-Z])(?=.*\d)(?=.*[!@#%$_&*()]).{8,16}$/)
            .min(8, {
                message: getValidationMessages({lang:lang, code:104})
            })
            .max(16, {
                message: getValidationMessages({lang:lang, code:105})
            }),


    username: (lang:LanguageEnum) =>
        z.string()
            .min(2, {
                message: getValidationMessages({lang:lang, code:102})
            })
            .max(51, {
                message: getValidationMessages({lang:lang, code:103})
            }),


    phone: (lang:LanguageEnum) =>
        z.e164({
            message: getValidationMessages({lang:lang, code:106})
        }),


    confirmPassword: (lang:LanguageEnum) =>
        z.string()
            .min(8, {
                message: getValidationMessages({lang:lang, code:104})
            })
            .max(16, {
                message: getValidationMessages({lang:lang, code:105})
            }),


    gender: (lang:LanguageEnum) =>
        z.enum(GenderEnum, {
            message: getValidationMessages({lang:lang, code:107})
        }),
    id: (lang:LanguageEnum) =>
        z.string().refine((data) => mongoose.Types.ObjectId.isValid(data), { message: "invalid formate" }), // mongoose.Types.ObjectId.isValid(data) بتتاكد ان الي راجع hixa string ولا لا
    files: (lang:LanguageEnum) =>
        z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.string(),
            buffer: z.instanceof(Buffer),
            size: z.number(),
            path: z.string(),

        }),
    matchFields

}
