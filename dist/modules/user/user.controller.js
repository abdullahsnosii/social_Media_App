"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_js_1 = __importDefault(require("./user.service.js"));
const authentication_middleware_js_1 = require("../../middleware/authentication.middleware.js");
const security_enum_js_1 = require("../../common/enum/security.enum.js");
const user_enum_js_1 = require("../../common/enum/user.enum.js");
const index_js_1 = require("../../middleware/index.js");
const multer_middleware_js_1 = require("../../middleware/multer.middleware.js");
const local_multer_js_1 = require("../../common/utils/multer/local.multer.js");
const validation_middleware_js_1 = require("../../middleware/validation.middleware.js");
const validators = __importStar(require("./user.validation.js"));
const user_social_service_js_1 = __importDefault(require("./user.social.service.js"));
const router = (0, express_1.Router)();
router.get("/", (0, authentication_middleware_js_1.authentication)(), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_service_js_1.default.profile(req.user);
    return { data };
}));
router.patch("/profile-image", (0, authentication_middleware_js_1.authentication)(), (0, multer_middleware_js_1.uploadMiddleware)({ multerMiddleware: (0, local_multer_js_1.localFielupload)({ maxFileSize: 2 }).single("attachment"), customPath: "users", validation: local_multer_js_1.fileValidation.image }), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    req.user.image = req.file.path;
    await req.user.save();
    return { data: { user: req.user } };
}));
router.patch("/", (0, authentication_middleware_js_1.authentication)(), (0, authentication_middleware_js_1.authorization)(user_enum_js_1.RoleEnum.USER), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_service_js_1.default.update(req.user, req.body);
    return { data };
}));
router.post("/rotate-token", (0, authentication_middleware_js_1.authentication)(security_enum_js_1.tokenTypeEnum.REFRESH), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_service_js_1.default.rotateToken(req.payload, req.user, `${req.protocol}://${req.host}`);
    console.log(req.payload);
    return { data };
}));
router.post("/logout", (0, authentication_middleware_js_1.authentication)(), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_service_js_1.default.logout(req.payload, req.user, req.body);
    console.log(req.payload);
    return { data };
}));
router.get("/search", (0, authentication_middleware_js_1.authentication)(), (0, validation_middleware_js_1.validation)(validators.search), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_social_service_js_1.default.search(req.user, req.validate.query);
    return { data };
}));
router.get("/suggestions", (0, authentication_middleware_js_1.authentication)(), (0, validation_middleware_js_1.validation)(validators.suggestions), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_social_service_js_1.default.suggestions(req.user, req.validate.query.limit);
    return { data };
}));
router.patch("/settings/privacy", (0, authentication_middleware_js_1.authentication)(), (0, validation_middleware_js_1.validation)(validators.updatePrivacy), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_social_service_js_1.default.updatePrivacy(req.user, req.validate.body.isPrivate);
    return { data };
}));
router.post("/:id/follow", (0, authentication_middleware_js_1.authentication)(), (0, validation_middleware_js_1.validation)(validators.userIdParam), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_social_service_js_1.default.follow(req.user, req.validate.params.id);
    return { status: 201, data };
}));
router.delete("/:id/follow", (0, authentication_middleware_js_1.authentication)(), (0, validation_middleware_js_1.validation)(validators.userIdParam), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    await user_social_service_js_1.default.unfollow(req.user, req.validate.params.id);
    return;
}));
router.get("/:id", (0, authentication_middleware_js_1.authentication)(), (0, validation_middleware_js_1.validation)(validators.userIdParam), (0, index_js_1.responseFormatter)(async (req, res, next) => {
    const data = await user_social_service_js_1.default.getUserProfile(req.user, req.validate.params.id);
    return { data };
}));
exports.default = router;
