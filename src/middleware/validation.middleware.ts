import { file, type ZodType } from "zod";
import { LanguageEnum } from "../common/enum";
import type { NextFunction, Request, Response } from "express";
import { BadRequestExciption } from "../common/exciption/Domain.exciption.js";

/**
export const login = (lang:LanguageEnum)=>{
     return z.object({
    body:loginSchema(lang),
})
}
  
 */
type ValidationSchemaType = (lang: LanguageEnum) => ZodType  // الي راجع منم type zod 
export const validation = (schema: ValidationSchemaType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const lang = Number(req.headers['accept-language'] ?? LanguageEnum.EN)
    console.log({ lang });
    //schema() == signup()
    const validationResult = schema(lang).safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    })
    //  console.log({validationResult});
    if (!validationResult.success) {
      throw new BadRequestExciption("validation Error", validationResult.error.issues)
    }
    req.validate = validationResult.data
    //  console.log({v:req.validate});

    next()
  }


}