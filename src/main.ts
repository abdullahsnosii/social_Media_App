import express from 'express'
import modules = require('./modules/index.js')
import errorMiddleware = require('./middleware/error.middleware.js')
import { PORT } from './config.js'
import { bootstarpDB } from './DB/connection.db'
import { sendEmail } from './common/utils/email/send.email.js'
import { EmailSubjectEnum } from './common/enum/email.enum.js'
const app: express.Application = express()
app.use(express.json())

bootstarpDB(app,PORT)

app.all("/", async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<express.Response> => {
    return res.status(200).json({ message: "done" })
})

app.use("/auth" , modules.authenticationController)
app.use("/users" , modules.userController)
app.use(errorMiddleware.globalErrorHandling )

sendEmail({subject:EmailSubjectEnum.CONFIRM_EMAIL , to:["sohylahaytham6@gmail.com"] , html:"sosoooo"})

