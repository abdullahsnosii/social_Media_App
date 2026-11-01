import mongoose from "mongoose";
import { DB_URI } from "../config";
import { UserModel } from "./model/user.model";
import type { Application } from "express";
//import { connectRedis } from "./model/redis.connection.js";

// problem in wifi with me
// import dns from "dns";
// dns.setServers(["192.168.1.1"]);

export const bootstarpDB=async (app:Application , port:number)=>{
    try {
        await mongoose.connect(DB_URI , {serverSelectionTimeoutMS:30000})
        console.log(`DB connected successfully ✅`)
      //  await connectRedis()
        await UserModel.syncIndexes()
        app.listen(port , ()=> console.log(`Example app listening on port ${port}`))
    } catch (error) {
        console.log(error)
        console.log(`Fail to connect DB ❌`)

    }
}