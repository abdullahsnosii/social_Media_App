"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const email_enum_js_1 = require("../../enum/email.enum.js");
const send_email_js_1 = require("./send.email.js");
const email_templates_js_1 = require("./template/email.templates.js");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on("send-Email", async ({ subject = email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL, recipients, data }) => {
    try {
        await (0, send_email_js_1.sendEmail)({
            ...recipients,
            subject,
            html: (0, email_templates_js_1.verifyEmailTemplate)({ code: data.code, subject, title: data.title ?? subject })
        });
    }
    catch (error) {
        console.log("Fail to send email", error);
    }
});
