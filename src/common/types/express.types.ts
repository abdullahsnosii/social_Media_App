
import { HUser } from "../../DB/model";
import { JwtPayloadType } from "../security";

declare module "express-serve-static-core" {
    interface Request {   // reopen مهمه اوي 
        validate:any,
        user:HUser,
        payload:JwtPayloadType
    }
}