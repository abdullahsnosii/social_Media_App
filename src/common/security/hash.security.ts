import bcrypt from "bcrypt"


export const  hash = async (plainText:string , rounds:number=12 , minor: 'a'|'b'="b"):Promise<string>=>{
const salt =  (await bcrypt.genSalt(rounds,minor)).toString()
return await bcrypt.hash(plainText , salt)
}


export const  compare = async (plainText:string , cipherText:string):Promise<boolean>=>{
return await bcrypt.compare(plainText , cipherText)
}



//switch between bcrypt and argon2

// import bcrypt from "bcrypt"
// import argon2 from "argon2"
// export const  hash = async ({plainText , rounds=12 , minor="b" , approach="bcrypt"})=>{

// let cipherText = ""

// switch (approach) {
//     case "bcrypt":
//         const salt =  (await bcrypt.genSalt(rounds,minor)).toString()
//         cipherText =  await bcrypt.hash(plainText , salt)
//         break;

//         case "argon2":
//         cipherText =  await argon2.hash(plainText)
//         break;

//     default:
//         break;
// }

// return cipherText

// }


// export const  compare = async (plainText , cipherText , approach="bcrypt")=>{

// let match = false;

// switch (approach) {
//     case "bcrypt":
//         match =  await bcrypt.compare(plainText , cipherText)
//         break;

//         case "argon2":
//         match =  await argon2.verify(cipherText , plainText)
//         break;

//     default:
//         break;
// }

// return match

// }