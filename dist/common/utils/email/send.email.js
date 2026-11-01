"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userEmaiTrialsKey = exports.userEmailKey = void 0;
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_js_1 = require("../../../config.js");
const Domain_exciption_js_1 = require("../../exciption/Domain.exciption.js");
const userEmailKey = ({ email, subject }) => {
    return `User::${email}::${subject}::OTP`;
};
exports.userEmailKey = userEmailKey;
const userEmaiTrialsKey = ({ email, subject }) => {
    return `${(0, exports.userEmailKey)({ email, subject })}::Trials`;
};
exports.userEmaiTrialsKey = userEmaiTrialsKey;
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: config_js_1.APP_EMAIL,
        pass: config_js_1.APP_PASSWORD,
    },
});
async function sendEmail({ to, cc, bcc, subject, text, html, attachments = [], }) {
    try {
        if (!to?.length && !cc?.length && !bcc?.length) {
            throw new Domain_exciption_js_1.BadRequestExciption("invalid recipient");
        }
        if (!html?.length && !text?.length && !attachments?.length) {
            throw new Domain_exciption_js_1.BadRequestExciption("invalid email content");
        }
        const info = await transporter.sendMail({
            from: `"${config_js_1.APP_NAME}" <${config_js_1.APP_EMAIL}>`,
            to,
            cc,
            bcc,
            subject,
            text,
            html,
            attachments: [],
        });
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
        console.log("Accepted:", info.accepted);
    }
    catch (err) {
        console.error("Error while sending mail:", err);
    }
}
