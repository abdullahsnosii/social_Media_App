
import { IFriendRequest} from "../interface";
import { FriendRequestModel} from "../../DB/model";
import { DatabaseRepository } from "./bace.repository.js";


export  class FriendRequestRepository extends DatabaseRepository<IFriendRequest> {
  constructor(){
    super(FriendRequestModel)
  }

  
}

export const friendRequestRepository = new FriendRequestRepository();