"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrivacy = exports.suggestions = exports.search = exports.userIdParam = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../../common/utils/index.js");
const userIdParam = (lang) => zod_1.z.object({
    params: zod_1.z.strictObject({ id: index_js_1.generalValidationFields.id(lang) })
});
exports.userIdParam = userIdParam;
const search = (lang) => zod_1.z.object({
    query: zod_1.z.strictObject({
        q: zod_1.z.string().trim().min(1).max(50),
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(10)
    })
});
exports.search = search;
const suggestions = (lang) => zod_1.z.object({
    query: zod_1.z.strictObject({
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(10)
    })
});
exports.suggestions = suggestions;
const updatePrivacy = (lang) => zod_1.z.object({
    body: zod_1.z.strictObject({ isPrivate: zod_1.z.boolean() })
});
exports.updatePrivacy = updatePrivacy;
