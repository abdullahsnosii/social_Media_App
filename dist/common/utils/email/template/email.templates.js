"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailTemplate = exports.templates = void 0;
const config_js_1 = require("../../../../config.js");
const email_enum_js_1 = require("../../../enum/email.enum.js");
const baseTemplate = (data) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #eef2ff;
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
    }

    .wrapper {
      width: 100%;
      padding: 40px 0;
    }

    .container {
      width: 520px;
      max-width: 92%;
      margin: auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.15);
    }

    .header {
      padding: 32px 25px;
      text-align: center;
      background-color: #4f46e5;
      background-image: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .content {
      padding: 40px 35px;
      text-align: center;
    }

    .content h2 {
      margin: 0 0 12px;
      color: #1f2937;
      font-size: 22px;
      font-weight: 700;
    }

    .content p {
      margin: 0 0 16px;
      color: #6b7280;
      font-size: 15px;
      line-height: 1.7;
    }

    .code {
      display: inline-block;
      margin: 24px auto;
      padding: 16px 32px;
      background-color: #eef2ff;
      border: 2px dashed #6366f1;
      border-radius: 12px;
      font-size: 34px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #4f46e5;
    }

    .warning {
      padding: 12px 16px;
      background-color: #fef3c7;
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }

    .note {
      font-size: 13px;
      color: #9ca3af;
    }

    .footer {
      padding: 22px;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>

<body>

  <div class="wrapper">

    <div class="container">

      <div class="header">
        <h1>${config_js_1.APP_NAME}</h1>
      </div>

      <div class="content">

        <h2>${data.title}</h2>

        <p>
          Use the verification code below to complete your request.
        </p>

        <div class="code">
          ${data.code}
        </div>

        <p class="warning">
          This code is confidential. Please do not share it with anyone.
        </p>

        <p class="note">
          If you did not request this code, you can safely ignore this email.
        </p>

      </div>

      <div class="footer">
        © ${new Date().getFullYear()} ${config_js_1.APP_NAME}. All rights reserved.
      </div>

    </div>

  </div>

</body>

</html>`;
exports.templates = {
    [email_enum_js_1.EmailSubjectEnum.CONFIRM_EMAIL]: baseTemplate,
    [email_enum_js_1.EmailSubjectEnum.FORGOT_PASSWORD]: baseTemplate,
    [email_enum_js_1.EmailSubjectEnum.TWO_STEP_VERIFICATION]: baseTemplate,
    [email_enum_js_1.EmailSubjectEnum.LOGIN]: baseTemplate,
};
const verifyEmailTemplate = (data) => {
    return exports.templates[data.subject](data);
};
exports.verifyEmailTemplate = verifyEmailTemplate;
