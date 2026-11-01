import type {  NextFunction, Request, Response } from "express"
import type { IResponse } from "../common/interface/response.interface"



export const responseFormatter = (handler: Function) => {  // middleware بتهندل الresponse
    return async (
        req: Request, 
        res:  Response,
        next: NextFunction
    ) : Promise<Response | void> => {
        const { message = true, data = undefined, status = 200, extra = undefined }: IResponse = await handler(req, res, next)
        if(res.headersSent)return; // لو رجعلك res ابعته كمل بيه لو لا كمل function
            return res.status(status).json({message,data,extra,status})

    }
}