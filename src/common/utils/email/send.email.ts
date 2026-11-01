import nodemailer from "nodemailer";
import { APP_EMAIL, APP_NAME, APP_PASSWORD } from "../../../config.js";
import { BadRequestExciption } from "../../exciption/Domain.exciption.js";
import { EmailSubjectEnum } from "../../enum/email.enum.js";



export const userEmailKey = ({ email, subject }: { email: string, subject: EmailSubjectEnum }): string => {
  return `User::${email}::${subject}::OTP`
}



export const userEmaiTrialsKey = ({ email, subject }: { email: string, subject: EmailSubjectEnum }): string => {
  return `${userEmailKey({ email, subject })}::Trials`
}


// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASSWORD,
  },
});


export async function sendEmail({
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments = [],
}: {
  to?: string[],
  cc?: string[],
  bcc?: string[],
  subject: string,
  text?: string,
  html?: string,
  attachments?: any[],
}) {
  try {

    if (!to?.length && !cc?.length && !bcc?.length) {
      throw new BadRequestExciption("invalid recipient")
    }

    if (!html?.length && !text?.length && !attachments?.length) {
      throw new BadRequestExciption("invalid email content")
    }

    const info = await transporter.sendMail({
      from:  `"${APP_NAME}" <${APP_EMAIL}>`, // sender address
      to, // list of recipients
      cc,
      bcc,
      subject, // subject line
      text, // plain text body
      html,
      attachments: [], // HTML body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      console.log("Accepted:", info.accepted); // اعرف بعت ل مين
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
}