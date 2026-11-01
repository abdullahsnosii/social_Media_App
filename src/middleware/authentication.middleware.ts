import type { NextFunction, Request, Response } from "express";
import { tokenTypeEnum } from "../common/enum/security.enum.js"
import { ForbiddenExciption, UnauthorizedExciption } from "../common/exciption/Domain.exciption.js";
import type { RoleEnum } from "../common/enum/user.enum.js";
import { tokenSecurity } from "../common/security/token.security.js"

export const bearerAuth = async({req,tokenType=tokenTypeEnum.ACCESS }:{req:Request,tokenType:tokenTypeEnum })=>{
     const [key, credential] = req.headers["authorization"]?.split(" ") || [];
     if (!credential) throw new UnauthorizedExciption("Missing credentials")
            const { user, payload } = await tokenSecurity.decodeToken({ authorization: credential, tokenType })
            req.user = user;
            req.payload = payload;
}
export const authentication = (tokenType = tokenTypeEnum.ACCESS)=>{
    return async (req: Request, res: Response, next: NextFunction)=>{

    const {authorization} = req.headers
    console.log(authorization);
    if(!authorization) throw new UnauthorizedExciption("Unauthorized Account")

    const [key , credential] = authorization.split(" ")
    console.log({key , credential});
    
    switch (key) {
        case "Basic":
            const [email , password] = Buffer.from(credential as string , "base64").toString().split(":")
            console.log({email , password});
            if (!email || !password) throw new UnauthorizedExciption("Invalid credentials")
            req.user = await tokenSecurity.basicAuth({email , password})
            break;

        case "Bearer":
          await bearerAuth({req,tokenType})
            break;

        default:
            return next(new UnauthorizedExciption ("Invalid authentication schema" , {cause:{status:400}}))
            break;
    }


    next()
}
}



export const authorization = (accessRole: RoleEnum)=>{
    return async (req: Request, res: Response, next: NextFunction)=>{

    if(req.user!.role < accessRole) throw new ForbiddenExciption("Forbidden Account")
     
     
    next()
}
}
