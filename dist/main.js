"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules = require("./modules/index.js");
const errorMiddleware = require("./middleware/error.middleware.js");
const config_js_1 = require("./config.js");
const connection_db_1 = require("./DB/connection.db");
const send_email_js_1 = require("./common/utils/email/send.email.js");
const email_enum_js_1 = require("./common/enum/email.enum.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, connection_db_1.bootstarpDB)(app, config_js_1.PORT);
app.all("/", async (req, res, next) => {
    return res.status(200).json({ message: "done" });
});
app.use("/auth", modules.authenticationController);
app.use("/users", modules.userController);
app.use(errorMiddleware.globalErrorHandling);
(0, send_email_js_1.sendEmail)({ subject: email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL, to: ["sohylahaytham6@gmail.com"], html: "sosoooo" });
