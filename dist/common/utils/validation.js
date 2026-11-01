"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFields = exports.matchFields = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const security_enum_js_1 = require("../enum/security.enum.js");
const user_enum_js_1 = require("../enum/user.enum.js");
const validationMessages = {
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
};
const getValidationMessages = ({ lang, code }) => {
    return lang == security_enum_js_1.LanguageEnum.AR ? validationMessages[code].ar : validationMessages[code].en;
};
const matchFields = ({ original, copy, data, ctx, lang }) => {
    if (data[original] !== data[copy]) {
        ctx.addIssue({
            code: "custom",
            path: [copy],
            message: getValidationMessages({ lang: lang, code: 109 })
        });
    }
};
exports.matchFields = matchFields;
exports.generalValidationFields = {
    email: (lang) => zod_1.z.email({
        message: getValidationMessages({ lang: lang, code: 101 })
    }),
    otp: (lang) => zod_1.z.string().regex(/^\d{6}$/, { error: "Invalid code" }),
    password: (lang) => zod_1.z.string().regex(/^(?=.*[a-z])(?=.*\s{0,})(?=.*[A-Z])(?=.*\d)(?=.*[!@#%$_&*()]).{8,16}$/)
        .min(8, {
        message: getValidationMessages({ lang: lang, code: 104 })
    })
        .max(16, {
        message: getValidationMessages({ lang: lang, code: 105 })
    }),
    username: (lang) => zod_1.z.string()
        .min(2, {
        message: getValidationMessages({ lang: lang, code: 102 })
    })
        .max(51, {
        message: getValidationMessages({ lang: lang, code: 103 })
    }),
    phone: (lang) => zod_1.z.e164({
        message: getValidationMessages({ lang: lang, code: 106 })
    }),
    confirmPassword: (lang) => zod_1.z.string()
        .min(8, {
        message: getValidationMessages({ lang: lang, code: 104 })
    })
        .max(16, {
        message: getValidationMessages({ lang: lang, code: 105 })
    }),
    gender: (lang) => zod_1.z.enum(user_enum_js_1.GenderEnum, {
        message: getValidationMessages({ lang: lang, code: 107 })
    }),
    id: (lang) => zod_1.z.string().refine((data) => mongoose_1.default.Types.ObjectId.isValid(data), { message: "invalid formate" }),
    files: (lang) => zod_1.z.strictObject({
        fieldname: zod_1.z.string(),
        originalname: zod_1.z.string(),
        encoding: zod_1.z.string(),
        mimetype: zod_1.z.string(),
        buffer: zod_1.z.instanceof(Buffer),
        size: zod_1.z.number(),
        path: zod_1.z.string(),
    }),
    matchFields: exports.matchFields
};
