import multer from "multer";
import { randomUUID } from 'node:crypto'
import { resolve } from "node:path";
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import type { Request } from "express";
import { BadRequestExciption } from "../../exciption/Domain.exciption.js";

export const fileValidation = {
    image:['image/jpeg' , 'image/png' , 'image/gif'],
    file:['application/pdf' , 'application/json']

}



export const localFielupload = ({maxFileSize = 5 }:{maxFileSize?:number}={})=>{
  
    const storage = multer.memoryStorage()
    return multer({storage , limits:{fileSize: maxFileSize * 1024 * 1024}})
}




export const proccessFile = async ({customPath = "general" , file , validation = []}:{customPath?:string , file:Express.Multer.File , validation?:string[]}):Promise<Express.Multer.File>=>{
       
        const result = await fileTypeFromBuffer(file.buffer)
         console.log({ size: file.size, validation, detected: result?.mime })
        if(!result || !validation.includes(result.mime)) {
           throw new BadRequestExciption("Invalid file formats")            
        }else{

            await mkdir(resolve(`./assets/${customPath}`) , {recursive : true})
           const uniqueFilepath = `assets/${customPath}/${randomUUID()}.${result.ext}`
           await writeFile(resolve(`./${uniqueFilepath}`) , file.buffer)

           file.path = uniqueFilepath
           return file
        }


    }


export const proccessFiles = async ({customPath , files = [] , validation = []}:{customPath:string , files?:Express.Multer.File[] , validation?:string[]}):Promise<Express.Multer.File[]>=>{  
 
   const assets:Express.Multer.File[] = []
   try {

    for (const file of files) {
    const uploadFile = await proccessFile({customPath , file , validation})
    assets.push(uploadFile)
  }  
  return assets

   } catch (error) {

    for (const file of files) {
      if (file.path) {
        await unlink(resolve(`./${file.path}`))
      }
   }
   throw error
 }}

 

 
export const proccessFields = async ({customPath , fields = {} , validation = []}:{customPath:string , fields?:{[fieldname:string]:Express.Multer.File[]} , validation?:string[]})=>{  
 
   const assets:{field:string , files:Express.Multer.File[]}[] = []

   try {

    for (const field of Object.keys(fields)) {
    const files = await proccessFiles({customPath , files : fields[field] ?? [] , validation})
    assets.push({field , files})
  }  
  return assets

   } catch (error) {
      for (const {files} of assets) {
        for (const file of files) {
             if (file.path) {
              await unlink(resolve(`./${file.path}`))
            }
   }
   }
   throw error
   }

  
 }



export const proccessMulterUpload = async ({req , customPath = "general", validation = []}:{req:Request , customPath?:string , validation?:string[]}):Promise<void>=>{

       if (req.file) {
         await proccessFile({customPath , file : req.file , validation})
       }
        else if (Array.isArray(req.files)) {
         await proccessFiles({customPath , files : req.files , validation})
       }
       else if(typeof req.files =="object" && Object.keys(req.files)?.length){
         await proccessFields({customPath , fields : req.files , validation})

       }
    }











































// export const proccessFile = ({validation = []})=>{
//     return async (req , res , next)=>{
//         const filepath = resolve(`./${file.path}`)
//         console.log({f:file , filepath});
//         const fileBuffer = await readFile(filepath)
//         console.log({fileBuffer});
//         const result = await fileTypeFromBuffer(fileBuffer)
//         console.log({result});
        

//         if(!result || !validation.includes(result.mime)) {
//             await unlink(filepath)
//             next(new Error("Invalid file formats" , {cause:{status:400}} ))
//         }

//         next()

//     }
// }