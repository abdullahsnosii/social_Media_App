import express from 'express'
import modules = require('./modules/index.js')
import errorMiddleware = require('./middleware/error.middleware.js')
import { PORT } from './config.js'
import { bootstarpDB } from './DB/connection.db'
import { sendEmail } from './common/utils/email/send.email.js'
import { EmailSubjectEnum } from './common/enum/email.enum.js'
import { UserModel, type HUser } from './DB/model/user.model.js'
import { ProviderEnum } from './common/enum/user.enum.js'
import { UserRepository } from './common/repository/user.repository.js'
import mongoose from 'mongoose'
const app: express.Application = express()
app.use(express.json())

bootstarpDB(app, PORT)

app.all("/", async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<express.Response> => {
    return res.status(200).json({ message: "done" })
})

app.use("/auth", modules.authenticationController)
app.use("/users", modules.userController)
app.use(errorMiddleware.globalErrorHandling)

sendEmail({ subject: EmailSubjectEnum.CONFIRM_EMAIL, to: ["sohylahaytham6@gmail.com"], html: "sosoooo" })

async function test() {
//     const user = new UserModel({
//         extra:{name:"string"},
//         firstName:"abdullah",
//         lastName:"snosy",
//         email:`${Date.now()}@gmail.com`,
//         phone :"010045665413",
//         password:"bkhjbkj",
//         // provider:ProviderEnum.GOOGLE,
//     })
//     await user.save()
//     user.passwoed="2222"
//     // user.extra.name="aaaaa"
//    // user.extra={name:"sfsfsf"}
//     await user.save()
// }
// test()

const userModel = new UserRepository()
const user = await userModel.findOne({  
    filter: { paranoid: false },
    // projection: { "extra": 0 }
}) as HUser
console.log(user);

}
test()

mongoose.connect(process.env.DB_URI as string)
  .then(() => console.log("DB CONNECTED"))
  .catch((err) => console.error("DB ERROR:", err.message));