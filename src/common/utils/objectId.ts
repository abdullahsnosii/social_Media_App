import mongoose from "mongoose"


export const ToObjectId =(id:string):mongoose.Types.ObjectId=>{
    return mongoose.Types.ObjectId.createFromHexString(id)
}