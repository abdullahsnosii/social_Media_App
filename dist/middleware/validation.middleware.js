"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const enum_1 = require("../common/enum");
const Domain_exciption_js_1 = require("../common/exciption/Domain.exciption.js");
const validation = (schema) => {
    return (req, res, next) => {
        const lang = Number(req.headers['accept-language'] ?? enum_1.LanguageEnum.EN);
        console.log({ lang });
        const validationResult = schema(lang).safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (!validationResult.success) {
            throw new Domain_exciption_js_1.BadRequestExciption("validation Error", validationResult.error.issues);
        }
        req.validate = validationResult.data;
        next();
    };
};
exports.validation = validation;
