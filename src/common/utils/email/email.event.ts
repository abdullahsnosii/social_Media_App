import { EventEmitter } from 'node:events'
import  { EmailSubjectEnum } from '../../enum/email.enum.js'
import { sendEmail } from './send.email.js'
import { verifyEmailTemplate } from './template/email.templates.js'
export const emailEvent = new EventEmitter()

emailEvent.on("send-Email", async (
   {
      subject = EmailSubjectEnum.CONFIRM_EMAIL,
      recipients,
      data
   }: {
      subject: EmailSubjectEnum,
      recipients: { to?: string[], cc?: string[], bcc?: string[] },
      data: any
   }) => {
   try {
      await sendEmail({
         ...recipients,
         subject,
         html: verifyEmailTemplate({ code: data.code, subject, title: data.title ?? subject })

      })
   } catch (error) {
      console.log("Fail to send email", error);

   }
})