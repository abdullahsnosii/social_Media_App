
import type { IUser } from "../interface/user.interface.js";
import { DatabaseRepository } from "./bace.repository.js";
import { UserModel } from "../../DB/model/user.model.js";




export class UserRepository extends DatabaseRepository<IUser> {
    constructor() {
        super(UserModel)
    }
} 