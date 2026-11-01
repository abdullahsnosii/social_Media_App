"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const Domain_exciption_js_1 = require("../common/exciption/Domain.exciption.js");
const local_multer_js_1 = require("../common/utils/multer/local.multer.js");
const uploadMiddleware = ({ isRequired = true, multerMiddleware, customPath = "general", validation = [] }) => {
    return (req, res, next) => {
        multerMiddleware(req, res, async (error) => {
            if (error) {
                next(new Domain_exciption_js_1.BadRequestExciption(error.message));
                return;
            }
            try {
                if (isRequired
                    && (!req.file &&
                        !(Array.isArray(req.files) && req.files.length) &&
                        !(typeof req.files == "object" && Object.keys(req.files)?.length))) {
                    next(new Domain_exciption_js_1.BadRequestExciption("File is required"));
                    return;
                }
                await (0, local_multer_js_1.proccessMulterUpload)({ req, customPath, validation });
                next();
            }
            catch (error) {
                next(error);
            }
        });
    };
};
exports.uploadMiddleware = uploadMiddleware;
