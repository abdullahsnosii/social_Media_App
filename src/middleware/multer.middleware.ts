import type { NextFunction, Request, RequestHandler, Response } from "express";
import { BadRequestExciption } from "../common/exciption/Domain.exciption.js";
import { proccessMulterUpload } from "../common/utils/multer/local.multer.js";


export const uploadMiddleware = ({isRequired = true , multerMiddleware , customPath = "general", validation = []}:{isRequired?:boolean , multerMiddleware:RequestHandler , customPath?:string , validation?:string[]})=>{

    return  (req:Request , res:Response , next:NextFunction)=>{
    multerMiddleware(req , res , async (error?:any)=>{
        if (error) {
            next(new BadRequestExciption(error.message));
            return;
        }

        try {
        if (
          isRequired
           && (
            !req.file &&
             !(Array.isArray(req.files) && req.files.length) &&
             !(typeof req.files =="object" && Object.keys(req.files)?.length)
            )
          ) {
        next(new BadRequestExciption("File is required"))
        return
        } 

         await proccessMulterUpload({req , customPath , validation })
         next()
        } catch (error) {
            next(error);
        }

    })
   
        
}
}