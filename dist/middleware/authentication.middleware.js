"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.authentication = exports.bearerAuth = void 0;
const security_enum_js_1 = require("../common/enum/security.enum.js");
const Domain_exciption_js_1 = require("../common/exciption/Domain.exciption.js");
const token_security_js_1 = require("../common/security/token.security.js");
const bearerAuth = async ({ req, tokenType = security_enum_js_1.tokenTypeEnum.ACCESS }) => {
    const [key, credential] = req.headers["authorization"]?.split(" ") || [];
    if (!credential)
        throw new Domain_exciption_js_1.UnauthorizedExciption("Missing credentials");
    const { user, payload } = await token_security_js_1.tokenSecurity.decodeToken({ authorization: credential, tokenType });
    req.user = user;
    req.payload = payload;
};
exports.bearerAuth = bearerAuth;
const authentication = (tokenType = security_enum_js_1.tokenTypeEnum.ACCESS) => {
    return async (req, res, next) => {
        const { authorization } = req.headers;
        console.log(authorization);
        if (!authorization)
            throw new Domain_exciption_js_1.UnauthorizedExciption("Unauthorized Account");
        const [key, credential] = authorization.split(" ");
        console.log({ key, credential });
        switch (key) {
            case "Basic":
                const [email, password] = Buffer.from(credential, "base64").toString().split(":");
                console.log({ email, password });
                if (!email || !password)
                    throw new Domain_exciption_js_1.UnauthorizedExciption("Invalid credentials");
                req.user = await token_security_js_1.tokenSecurity.basicAuth({ email, password });
                break;
            case "Bearer":
                await (0, exports.bearerAuth)({ req, tokenType });
                break;
            default:
                return next(new Domain_exciption_js_1.UnauthorizedExciption("Invalid authentication schema", { cause: { status: 400 } }));
                break;
        }
        next();
    };
};
exports.authentication = authentication;
const authorization = (accessRole) => {
    return async (req, res, next) => {
        if (req.user.role < accessRole)
            throw new Domain_exciption_js_1.ForbiddenExciption("Forbidden Account");
        next();
    };
};
exports.authorization = authorization;
