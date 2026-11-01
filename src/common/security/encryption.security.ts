import crypto from 'node:crypto'
import { ENC_KEY, IV_LENGTH } from '../../config.js';


export const  encryption = async (plainText:string):Promise<string>=>{
const iv = crypto.randomBytes(IV_LENGTH)
const cipher = crypto.createCipheriv('aes-256-cbc' , ENC_KEY , iv );
let encryptData = cipher.update(plainText , "utf-8" , "hex")
encryptData+= cipher.final("hex")
// console.log({iv,cipher , encryptData});
return`${iv.toString("hex")}::${encryptData}`

}


export const decryption = async (cipherText:string):Promise<string>=>{
const [iv , encryptedData] = cipherText.split("::") as [string | Buffer , string] 
// console.log({iv:iv , encryptedData:encryptedData})
const iv_vector = Buffer.from(iv as string,"hex")
// console.log(iv_vector);
const decipherVector = crypto.createDecipheriv('aes-256-cbc' , ENC_KEY , iv_vector)
let plainText = decipherVector.update(encryptedData , "hex" , "utf-8")
plainText+= decipherVector.final("utf8")
return plainText
}