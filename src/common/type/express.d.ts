import type { HydratedDocument } from "mongoose"
import type { JwtPayload } from "jsonwebtoken"
import type { IUser } from "../interface/user.interface.js"

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>
      payload?: JwtPayload
    }
  }
}

export {}